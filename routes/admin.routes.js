const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

// ===============================
// ADMIN DASHBOARD
// ===============================
router.get(
    "/dashboard",
    verifyToken,
    isAdmin,
    adminController.getDashboard
);

module.exports = router;