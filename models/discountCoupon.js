const mongoose = require('mongoose');

const discountCouponSchema = mongoose.Schema({
    name: String,
    rate: Number
})

module.exports = mongoose.model("discountCoupon" , discountCouponSchema);