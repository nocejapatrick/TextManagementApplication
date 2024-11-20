const mongoose = require('mongoose');

const smsTransactionMessage = new mongoose.Schema({
    smstransaction: 
        {type: mongoose.Schema.Types.ObjectId, ref: 'SMSTransaction'}
      ,
    smsmessage: 
        {type: mongoose.Schema.Types.ObjectId, ref: 'SMSMessage'}
      
});

module.exports = mongoose.model("SMSTransactionMessage",smsTransactionMessage);