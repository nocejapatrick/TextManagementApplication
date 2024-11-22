const mongoose = require('mongoose');

const smsTransaction = new mongoose.Schema({
    recipient: String,
    isOpen: Boolean,
    open_at: Date,
    close_at: {
        type: Date, default: null
    },
    // questions:[
    //     {
    //         id: Number,
    //         answered: { type: Boolean, default: false},
    //         sentOn: { type: Date, default:null }
    //     }
    // ],
    currentQuestionId: Number
});

module.exports = mongoose.model("SMSTransaction",smsTransaction);