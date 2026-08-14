const pool = require("../config/db");

// =====================================
// GET DASHBOARD
// =====================================
exports.getDashboard = async (req, res) => {
    try {

        // =====================================
        // TOTAL USERS
        // =====================================

        const usersResult = await pool.query(`
            SELECT COUNT(*) AS total_users
            FROM users
        `);


        // =====================================
        // TOTAL COURTS
        // =====================================

        const courtsResult = await pool.query(`
            SELECT COUNT(*) AS total_courts
            FROM courts
        `);


        // =====================================
        // TOTAL BOOKINGS
        // =====================================

        const bookingsResult = await pool.query(`
            SELECT COUNT(*) AS total_bookings
            FROM bookings
        `);


        // =====================================
        // TOTAL REVENUE
        // CHỈ TÍNH BOOKING ĐÃ HOÀN THÀNH
        // =====================================

        const revenueResult = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM bookings
            WHERE booking_status = 'Completed'
        `);


        // =====================================
        // RECENT BOOKINGS
        // =====================================

        const recentBookingsResult = await pool.query(`
            SELECT
                b.booking_id,
                u.nickname,
                c.court_name,
                b.time_start,
                b.time_end,
                b.booking_status,
                b.total_amount

            FROM bookings b

            INNER JOIN users u
                ON b.user_id = u.user_id

            INNER JOIN courts c
                ON b.court_id = c.court_id

            ORDER BY b.booking_id DESC

            LIMIT 5
        `);


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({

            success: true,

            data: {

                total_users:
                    parseInt(usersResult.rows[0].total_users),

                total_courts:
                    parseInt(courtsResult.rows[0].total_courts),

                total_bookings:
                    parseInt(bookingsResult.rows[0].total_bookings),

                total_revenue:
                    parseFloat(revenueResult.rows[0].total_revenue),

                recent_bookings:
                    recentBookingsResult.rows

            }

        });


    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }
};