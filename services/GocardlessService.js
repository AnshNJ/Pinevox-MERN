const GoCardlessClient = require('gocardless-nodejs');
const { Webhooks } = require('gocardless-nodejs/webhooks');
const Mandate = require('../models/Mandate')
const User = require('../models/User')
const NotFoundError = require('../errors/not-found')
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const redirectUrl = process.env.REDIRECT_URL;
const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
const webhookToken = process.env.GOCARDLESS_WEBHOOK_TOKEN;


const client = gocardless(
  accessToken,
  constants.Environments.Sandbox,
  { raiseOnIdempotencyConflict: true },
);


const createBillingRequest = async (billingRequestDTO) => {
  return await client.billingRequests.create({
    payment_request: {
      description: billingRequestDTO.description,
      amount: billingRequestDTO.amount,
      currency: 'GBP',
      app_fee: billingRequestDTO.appFee
    },
    mandate_request: {
      scheme: billingRequestDTO.mandateScheme
    }
  });
}

const createRequestFlow = async (billId) => {
  return await client.billingRequestFlows.create({
    redirect_uri: `${redirectUrl}/PaymentSuccess`,
    exit_uri: `${redirectUrl}/PaymentFailure`,
    links: {
      billing_request: billId
    }
  });
}

const  initializeMandate = async (billingRequestDTO) => {
  const {userEmail} = billingRequestDTO;

  const user = await User.findOne({userEmail: userEmail});

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const billingRequest = await createBillingRequest(billingRequestDTO);
  const billId = billingRequest.id;

  const billingRequestFlow = await createRequestFlow(billId);
  const authorisationUrl = billingRequestFlow.authorisation_url;

  const mandateData = {
    aPackage: billingRequestDTO.description,
    service: user.services,
    mandateDate: new Date(),
    paymentStatus: 'pending',
    totalAmount: billingRequestDTO.amount,
    gocardlessMandateId: billId,
    user: user._id
  };

  await Mandate.findOneAndUpdate(
    { user: user._id },
    mandateData,
    { 
      new: true, 
      runValidators: true, 
      upsert: true, 
      setDefaultsOnInsert: true 
    }
  );

  return authorisationUrl;
}

const mandateStatus = async (signatureHeader, requestBody) => {
  try {
    const events = Webhooks.parse(requestBody, signatureHeader, this.webhookToken);
    let responseBody = '';

    for (const event of events) {
      responseBody += await processEvent(event);
    }

    return { status: 200, body: responseBody };
  } catch (error) {
    if (error.name === 'InvalidSignatureError') {
      return { status: 400, body: 'Incorrect Signature' };
    }
    throw error;
  }
}

const processEvent = async (event) => {
  switch (event.resource_type) {
    case 'billing_requests':
      return await processMandate(event);
    default:
      return `Don't know how to process an event of resource_type ${event.resource_type}.\n`;
  }
}

const processMandate = async (event) => {
  const mandateId = event.links.billing_request;
  const mandate = await Mandate.findOne({gocardlessMandateId: mandateId});

  if (!mandate) {
    return 'Mandate not found.\n';
  }

  switch (event.action) {
    case 'fulfilled':
      await handlePaymentSuccess(mandate);
      return `Mandate ${mandateId} successful.\n`;
    case 'failed':
      await handlePaymentFailure(mandate);
      return `Mandate ${mandateId} failed.\n`;
    case 'cancelled':
      await handlePaymentCancelled(mandate);
      return `Mandate ${mandateId} has been cancelled.\n`;
    default:
      return `Do not know how to process an event with action ${event.action}.\n`;
  }
}

const handlePaymentSuccess = async (mandate) => {
  mandate.paymentStatus = 'success';
  await mandate.save();
}

const handlePaymentFailure = async (mandate) => {
  mandate.paymentStatus = 'failed';
  await mandate.save();
}

const handlePaymentCancelled =  async (mandate) => {
  mandate.paymentStatus = 'cancelled';
  await mandate.save();
}


module.exports = {initializeMandate , mandateStatus};