const GoCardlessClient = require('gocardless-nodejs');
const { Webhooks } = require('gocardless-nodejs/webhooks');
const Mandate = require('../models/Mandate')
const User = require('../models/User')
const NotFoundError = require('../errors/not-found')

class GoCardlessService {
  constructor() {
    this.accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
    // this.webhookToken = process.env.GOCARDLESS_WEBHOOK_TOKEN;
    this.redirectUrl = process.env.REDIRECT_URL;
    this.client = new GoCardlessClient(
      this.accessToken,
      { environment: 'SANDBOX' } // Change to 'live' in production
    );
  }

  async createBillingRequest(billingRequestDTO) {
    return await this.client.billingRequests.create({
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

  async createRequestFlow(billId) {
    return await this.client.billingRequestFlows.create({
      redirect_uri: `${this.redirectUrl}/PaymentSuccess`,
      exit_uri: `${this.redirectUrl}/PaymentFailure`,
      links: {
        billing_request: billId
      }
    });
  }

  async initializeMandate(billingRequestDTO) {
    const {userEmail} = billingRequestDTO;

    const user = await User.findOne({userEmail: userEmail});

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const billingRequest = await this.createBillingRequest(billingRequestDTO);
    const billId = billingRequest.id;

    const billingRequestFlow = await this.createRequestFlow(billId);
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

    let newMandate = await Mandate.findOneAndUpdate(
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

  async mandateStatus(signatureHeader, requestBody) {
    try {
      const events = Webhooks.parse(requestBody, signatureHeader, this.webhookToken);
      let responseBody = '';

      for (const event of events) {
        responseBody += await this.processEvent(event);
      }

      return { status: 200, body: responseBody };
    } catch (error) {
      if (error.name === 'InvalidSignatureError') {
        return { status: 400, body: 'Incorrect Signature' };
      }
      throw error;
    }
  }

  async processEvent(event) {
    switch (event.resource_type) {
      case 'billing_requests':
        return await this.processMandate(event);
      default:
        return `Don't know how to process an event of resource_type ${event.resource_type}.\n`;
    }
  }

  async processMandate(event) {
    const mandateId = event.links.billing_request;
    const mandate = await Mandate.findOne({gocardlessMandateId: mandateId});

    if (!mandate) {
      return 'Mandate not found.\n';
    }

    switch (event.action) {
      case 'fulfilled':
        await this.handlePaymentSuccess(mandate);
        return `Mandate ${mandateId} successful.\n`;
      case 'failed':
        await this.handlePaymentFailure(mandate);
        return `Mandate ${mandateId} failed.\n`;
      case 'cancelled':
        await this.handlePaymentCancelled(mandate);
        return `Mandate ${mandateId} has been cancelled.\n`;
      default:
        return `Do not know how to process an event with action ${event.action}.\n`;
    }
  }

  async handlePaymentSuccess(mandate) {
    mandate.paymentStatus = 'success';
    await mandate.save();
  }

  async handlePaymentFailure(mandate) {
    mandate.paymentStatus = 'failed';
    await mandate.save();
  }

  async handlePaymentCancelled(mandate) {
    mandate.paymentStatus = 'cancelled';
    await mandate.save();
  }
}

module.exports = GoCardlessService;