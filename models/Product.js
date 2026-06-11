// models/User.js
const mongoose = require('mongoose');

const ProducSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    image : {
        type : String,
        required : true
    },
    price:{
        type: Number,
        required:true,
    },
    amount:{
        type: Number,
        required:true,
    },

});



module.exports = mongoose.model('Products', ProducSchema);