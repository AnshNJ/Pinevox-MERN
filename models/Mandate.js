const mongoose = require('mongoose');

const MandateSchema = mongoose.Schema({
    package:{
        type:String,
        required:[true, "Please provide package type"],
        default: 'standard'
    },
    mandateDate:{
        type: Date,
        default: Date.now(),
    },
    totalAmount:{
        type: Number,
        required: [true, "Please provide a valid total amount"],
        min: [0, "Total amount cannot be below 0"]
    },
    gocardlessMandateId:{
        type: String
    },
    paymentStatus:{
        type:String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    user:{
        type: mongoose.Types.ObjectId, //Join with another doc's object ID
        ref: "User", //which model are we referencing
        required: [true, "Please provide a user"],
    }
})

module.exports = mongoose.model("Mandate", MandateSchema);