const express = require("express");
const asyncHandler = require('express-async-handler')
const { sendSMS,setSMSTransaction,sendSMSTransactionMessage } = require("../../../../controllers/GSMController");
const checkTempAPIToken = require('../../../../middlewares/checkTempAPIToken');
const router = express.Router();

router.post("/text-sms", checkTempAPIToken, asyncHandler(sendSMS));
router.post("/set-sms-transaction", checkTempAPIToken, asyncHandler(setSMSTransaction));
router.post("/send-sms-transaction-message", checkTempAPIToken, asyncHandler(sendSMSTransactionMessage));

module.exports = router;