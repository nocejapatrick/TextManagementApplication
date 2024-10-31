const express = require("express");
const asyncHandler = require('express-async-handler')
const {login,registration,logout} = require("../../../../controllers/authenticationController");
const router = express.Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(registration));
router.post('/logout', asyncHandler(logout));

module.exports = router;