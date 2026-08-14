const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const usersController = require("../controllers/users.controller");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/forgot-password", usersController.forgotPassword);

// Chỉ cần API này
router.post("/verify-otp", usersController.verifyOTP);

module.exports = router;