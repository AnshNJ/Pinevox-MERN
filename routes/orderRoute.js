const express = require('express');
const router = express.Router();
const { saveOrder, getOrders } = require('../controller/orderController')


router.route('/').post(saveOrder).get(getOrders);
router.post('/webhook', express.raw({type: 'application/json'}));

module.exports = router;