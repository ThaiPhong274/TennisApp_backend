const express = require("express");
const router = express.Router();

const courtsController = require("../controllers/courts.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");
const uploadCourt =
    require("../middleware/courtUpload.middleware");
const upload = require("../middleware/upload.middleware");

// ===============================
// GET ALL COURTS
// ===============================
router.get(
    "/",
    courtsController.getAllCourts
);

// ===============================
// GET COURT BY ID
// ===============================
router.get(
    "/:id",
    courtsController.getCourtById
);

// ===============================
// UPLOAD COURT IMAGE (ADMIN)
// ===============================
router.post(
    "/upload-image",
    verifyToken,
    isAdmin,
    uploadCourt.single("image"),
    courtsController.uploadCourtImage
);

// ===============================
// CREATE COURT (ADMIN)
// ===============================
router.post(
    "/",
    verifyToken,
    isAdmin,
    courtsController.createCourt
);

// ===============================
// UPDATE COURT (ADMIN)
// ===============================
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    courtsController.updateCourt
);

// ===============================
// DELETE COURT (ADMIN)
// ===============================
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    courtsController.deleteCourt
);

module.exports = router;