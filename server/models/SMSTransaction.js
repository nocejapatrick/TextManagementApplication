const mongoose = require('mongoose');

const smsTransaction = new mongoose.Schema({
    recipient: String,
    isOpen: Boolean,
    open_at: Date,
    close_at: {
        type: Date, default: null
    }
});

module.exports = mongoose.model("SMSTransaction",smsTransaction);