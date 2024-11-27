const mongoose = require('mongoose');

const smsQuestionAnswer = new mongoose.Schema({
    smsTransactionId: 
    {type: mongoose.Schema.Types.ObjectId, ref: 'SMSTransaction'},
    questionId: Number,
    answer: String,
});

module.exports = mongoose.model("SMSQuestionAnswer",smsQuestionAnswer);