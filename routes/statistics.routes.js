const express = require("express");

const router = express.Router();

const statisticsController =
    require("../controllers/statistics.controller");

const {
    verifyToken
} = require("../middleware/auth.middleware");

const {
    isAdmin
} = require("../middleware/admin.middleware");


// =====================================
// ADMIN STATISTICS
// =====================================

router.get(
    "/",
    verifyToken,
    isAdmin,
    statisticsController.getStatistics
);


module.exports = router;