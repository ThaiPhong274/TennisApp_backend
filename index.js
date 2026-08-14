const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// ============================================================
// TIMEZONE - VIỆT NAM
// ============================================================

process.env.TZ = "Asia/Ho_Chi_Minh";

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ============================================================
// UPLOADS
// ============================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// ============================================================
// API
// ============================================================

app.use(
    "/api",
    require("./routes")
);

// ============================================================
// DATABASE
// ============================================================

const pool = require("./config/db");

pool.connect()
    .then(() => {
        console.log("=================================");
        console.log("✅ PostgreSQL Connected");
        console.log("🇻🇳 Timezone: Asia/Ho_Chi_Minh");
        console.log("=================================");
    })
    .catch((err) => {
        console.log(
            "❌ PostgreSQL Connection Error:",
            err
        );
    });

// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 3001;

app.listen(
    PORT,
    () => {
        console.log(
            `Server đang chạy trên cổng ${PORT}`
        );

        console.log(
            "🇻🇳 Server timezone:",
            Intl.DateTimeFormat().resolvedOptions().timeZone
        );

        console.log(
            "🇻🇳 Server time:",
            new Date().toString()
        );
    }
);