const express = require("express");

const router = express.Router();

const notificationsController =
    require("../controllers/notifications.controller");

const {
    verifyToken
} = require("../middleware/auth.middleware");


// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ============================================================

router.get(
    "/",
    verifyToken,
    notificationsController.getMyNotifications
);


// ============================================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// ============================================================

router.get(
    "/unread-count",
    verifyToken,
    notificationsController.getUnreadCount
);


// ============================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// ============================================================

router.patch(
    "/read-all",
    verifyToken,
    notificationsController.markAllAsRead
);


// ============================================================
// MARK AS READ
// PATCH /api/notifications/:id/read
// ============================================================

router.patch(
    "/:id/read",
    verifyToken,
    notificationsController.markAsRead
);


// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

router.delete(
    "/:id",
    verifyToken,
    notificationsController.deleteNotification
);


module.exports = router;