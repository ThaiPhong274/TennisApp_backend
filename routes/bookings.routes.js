const express = require("express");
const router = express.Router();

const bookingsController = require("../controllers/bookings.controller");

const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

// =====================================
// GET ALL BOOKINGS (ADMIN)
// =====================================
router.get(
    "/",
    verifyToken,
    isAdmin,
    bookingsController.getAllBookings
);

// =====================================
// GET MY BOOKINGS
// =====================================
router.get(
    "/my",
    verifyToken,
    bookingsController.getMyBookings
);

// =====================================
// GET BOOKINGS BY COURT & DATE
// =====================================
router.get(
    "/court/:courtId",
    verifyToken,
    bookingsController.getBookingsByCourt
);

// =====================================
// GET BOOKING BY ID
// =====================================
router.get(
    "/:id",
    verifyToken,
    bookingsController.getBookingById
);

// =====================================
// CREATE BOOKING
// =====================================
router.post(
    "/",
    verifyToken,
    bookingsController.createBooking
);

// =====================================
// UPDATE BOOKING
// =====================================
router.put(
    "/:id",
    verifyToken,
    bookingsController.updateBooking
);

// =====================================
// CANCEL BOOKING
// =====================================
router.patch(
    "/:id/cancel",
    verifyToken,
    bookingsController.cancelBooking
);

// =====================================
// CONFIRM BOOKING (ADMIN)
// =====================================
router.patch(
    "/:id/confirm",
    verifyToken,
    isAdmin,
    bookingsController.confirmBooking
);

// =====================================
// COMPLETE BOOKING (ADMIN)
// =====================================
router.patch(
    "/:id/complete",
    verifyToken,
    isAdmin,
    bookingsController.completeBooking
);

module.exports = router;