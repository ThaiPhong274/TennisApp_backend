const express = require("express");
const router = express.Router();

const courtTypesController = require("../controllers/courtTypes.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");


// =====================================
// GET ACTIVE COURT TYPES
// GET /api/court-types
// =====================================

router.get(
    "/",
    courtTypesController.getCourtTypes
);


// =====================================
// GET ALL COURT TYPES
// INCLUDING INACTIVE
// GET /api/court-types/all
// ADMIN
// =====================================

router.get(
    "/all",
    verifyToken,
    isAdmin,
    courtTypesController.getAllCourtTypes
);


// =====================================
// GET COURT TYPE BY ID
// GET /api/court-types/:id
// =====================================

router.get(
    "/:id",
    courtTypesController.getCourtTypeById
);


// =====================================
// CREATE COURT TYPE
// POST /api/court-types
// ADMIN
// =====================================

router.post(
    "/",
    verifyToken,
    isAdmin,
    courtTypesController.createCourtType
);


// =====================================
// UPDATE COURT TYPE
// PUT /api/court-types/:id
// ADMIN
// =====================================

router.put(
    "/:id",
    verifyToken,
    isAdmin,
    courtTypesController.updateCourtType
);


// =====================================
// DELETE / DISABLE COURT TYPE
// DELETE /api/court-types/:id
// ADMIN
// =====================================

router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    courtTypesController.deleteCourtType
);


// =====================================
// RESTORE COURT TYPE
// PATCH /api/court-types/:id/restore
// ADMIN
// =====================================

router.patch(
    "/:id/restore",
    verifyToken,
    isAdmin,
    courtTypesController.restoreCourtType
);


module.exports = router;