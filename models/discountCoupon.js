const mongoose = require('mongoose');

const discountCouponSchema = mongoose.Schema({
    name: String,
    rate: Number,
    expiry:{
        type: String,
        required: false
    }
},{timestamps: true});

module.exports = mongoose.model("discountCoupon" , discountCouponSchema);