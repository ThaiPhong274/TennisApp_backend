const express = require("express");

const router = express.Router();


// =====================================
// AUTH
// =====================================

router.use(
    "/auth",
    require("./auth.routes")
);


// =====================================
// USERS
// =====================================

router.use(
    "/users",
    require("./users.routes")
);


// =====================================
// COURT TYPES
// =====================================

router.use(
    "/court-types",
    require("./courtTypes.routes")
);


// =====================================
// COURTS
// =====================================

router.use(
    "/courts",
    require("./courts.routes")
);


// =====================================
// BOOKINGS
// =====================================

router.use(
    "/bookings",
    require("./bookings.routes")
);


// =====================================
// NOTIFICATIONS
// =====================================

router.use(
    "/notifications",
    require("./notifications.routes")
);


// =====================================
// ADMIN
// =====================================

router.use(
    "/admin",
    require("./admin.routes")
);


// =====================================
// ADMIN STATISTICS
// =====================================

router.use(
    "/admin/statistics",
    require("./statistics.routes")
);


// =====================================
// HOME
// =====================================

router.use(
    "/home",
    require("./home.routes")
);


module.exports = router;