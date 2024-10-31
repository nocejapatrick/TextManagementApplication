const express = require("express");
const asyncHandler = require('express-async-handler')
const { getAllUsers } = require("../../../../controllers/userController");
const router = express.Router();

router.get("/users", asyncHandler(getAllUsers));

module.exports = router;