const express = require("express");

const router = express.Router();

const homeController = require("../controllers/home.controller");

router.get("/courts", homeController.getHomeCourts);

module.exports = router;