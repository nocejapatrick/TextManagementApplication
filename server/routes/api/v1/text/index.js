const express = require("express");
const asyncHandler = require('express-async-handler')
const { sendSMS } = require("../../../../controllers/GSMController");
const checkTempAPIToken = require('../../../../middlewares/checkTempAPIToken');
const router = express.Router();

router.post("/text-sms", checkTempAPIToken, asyncHandler(sendSMS));

module.exports = router;