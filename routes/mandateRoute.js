const express = require('express');
const router = express.Router();
const { initiateMandate, gocardlessWebhook } = require('../controller/mandateController');

router.route('/billing').post(initiateMandate);
router.route('/webhooks/gocardless').post(gocardlessWebhook);

module.exports = router;
