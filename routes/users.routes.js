const express = require("express");

const router = express.Router();

const usersController = require("../controllers/users.controller");

const {
    verifyToken
} = require("../middleware/auth.middleware");

const {
    isAdmin
} = require("../middleware/admin.middleware");

const upload = require("../middleware/upload.middleware");


// ============================================================
// ADMIN - GET ALL USERS
// GET /api/users
// ============================================================

router.get(
    "/",
    verifyToken,
    isAdmin,
    usersController.getAllUsers
);


// ============================================================
// USER PROFILE
// GET /api/users/profile
// ============================================================

router.get(
    "/profile",
    verifyToken,
    usersController.profile
);


// ============================================================
// UPLOAD AVATAR
// PUT /api/users/profile/avatar
// ============================================================

router.put(
    "/profile/avatar",
    verifyToken,
    upload.single("avatar"),
    usersController.uploadAvatar
);


// ============================================================
// UPDATE PROFILE
// PUT /api/users/profile
// ============================================================

router.put(
    "/profile",
    verifyToken,
    usersController.updateProfile
);


// ============================================================
// ADMIN - LOCK / UNLOCK USER
// PUT /api/users/:id/status
// ============================================================

router.put(
    "/:id/status",
    verifyToken,
    isAdmin,
    usersController.updateUserStatus
);


// ============================================================
// CHANGE PASSWORD
// PUT /api/users/change-password
// ============================================================

router.put(
    "/change-password",
    verifyToken,
    usersController.changePassword
);


// ============================================================
// ADMIN - RESET USER PASSWORD
// PUT /api/users/:id/reset-password
// ============================================================

router.put(
    "/:id/reset-password",
    verifyToken,
    isAdmin,
    usersController.resetUserPassword
);


// ============================================================
// ADMIN - DELETE USER
// DELETE /api/users/:id
// ============================================================

router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    usersController.deleteUser
);


module.exports = router;