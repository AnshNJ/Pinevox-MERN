const GoCardlessService = require('../services/GocardlessService');
const { StatusCodes } = require('http-status-codes')

const goCardlessService = new GoCardlessService();

const initiateMandate = async (req, res) => {
    req.body.userEmail = req.user.userEmail;
    const authorisationUrl = await goCardlessService.initializeMandate(req.body);
    res.status(StatusCodes.CREATED).json({ authorisationUrl });
}

const gocardlessWebhook = async (req, res) => {
    const signatureHeader = req.headers['webhook-signature'];
    const { status, body } = await goCardlessService.mandateStatus(signatureHeader, req.body);
    res.status(status).send(body);  
}

module.exports = {initiateMandate, gocardlessWebhook};