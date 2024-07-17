const mongoose = require('mongoose');

const AddressSchema = mongoose.Schema({
    shipping_building:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_street:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_landmark:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_city:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_state:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_zip:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    shipping_country:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_building:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_street:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_landmark:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_city:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_state:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_zip:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    company_country:{
        type: String,
        required: [true, "Please provide a name"],
        minlength: 1,
        maxlength: 50,
    },
    user:{
        type: mongoose.Types.ObjectId, //Join with another doc's object ID
        ref: "User", //which model are we referencing
        required: [true, "Please provide a user"],
        unique: true
    }
})

module.exports = mongoose.model("Address", AddressSchema);