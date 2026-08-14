const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

// =====================================
// GET DASHBOARD
// =====================================

router.get(
    "/",
    dashboardController.getDashboard
);

module.exports = router;