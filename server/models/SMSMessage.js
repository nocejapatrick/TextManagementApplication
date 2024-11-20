const mongoose = require('mongoose');

const smsMessage = new mongoose.Schema({
    recipient: String,
    sender: String,
    message: String,
    sendOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SMSMessage",smsMessage);