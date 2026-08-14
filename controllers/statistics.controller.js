const pool = require("../config/db");

// =====================================
// ADMIN STATISTICS
// =====================================

exports.getStatistics = async (req, res) => {
    try {

        // =====================================
        // SYSTEM
        // =====================================

        const totalUsers = await pool.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);

        const totalCourts = await pool.query(`
            SELECT COUNT(*) AS total
            FROM courts
            WHERE is_active = true
        `);


        // =====================================
        // BOOKING
        // =====================================

        const totalBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
        `);

        const pendingBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Pending'
        `);

        const confirmedBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Confirmed'
        `);

        const completedBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Completed'
        `);

        const cancelledBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Cancelled'
        `);


        // =====================================
        // REVENUE
        // =====================================

        const todayRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total
            FROM bookings
            WHERE booking_status = 'Completed'
            AND DATE(updated_at) = CURRENT_DATE
        `);


        const monthRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total
            FROM bookings
            WHERE booking_status = 'Completed'
            AND DATE_TRUNC('month', updated_at)
                = DATE_TRUNC('month', CURRENT_DATE)
        `);


        const yearRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total
            FROM bookings
            WHERE booking_status = 'Completed'
            AND DATE_TRUNC('year', updated_at)
                = DATE_TRUNC('year', CURRENT_DATE)
        `);


        // =====================================
        // LAST 7 DAYS
        // =====================================

        const last7Days = await pool.query(`
            SELECT
                DATE(updated_at) AS date,

                COUNT(*) AS total_bookings,

                COALESCE(
                    SUM(
                        CASE
                            WHEN booking_status = 'Completed'
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS revenue

            FROM bookings

            WHERE updated_at >= CURRENT_DATE - INTERVAL '6 days'

            GROUP BY DATE(updated_at)

            ORDER BY DATE(updated_at) ASC
        `);


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({
            success: true,

            data: {

                // SYSTEM
                total_users:
                    Number(totalUsers.rows[0].total),

                total_courts:
                    Number(totalCourts.rows[0].total),


                // BOOKING
                total_bookings:
                    Number(totalBookings.rows[0].total),

                pending_bookings:
                    Number(pendingBookings.rows[0].total),

                confirmed_bookings:
                    Number(confirmedBookings.rows[0].total),

                completed_bookings:
                    Number(completedBookings.rows[0].total),

                cancelled_bookings:
                    Number(cancelledBookings.rows[0].total),


                // REVENUE
                today_revenue:
                    Number(todayRevenue.rows[0].total),

                month_revenue:
                    Number(monthRevenue.rows[0].total),

                year_revenue:
                    Number(yearRevenue.rows[0].total),


                // LAST 7 DAYS
                last_7_days:
                    last7Days.rows.map(row => ({
                        date: row.date,

                        total_bookings:
                            Number(row.total_bookings),

                        revenue:
                            Number(row.revenue)
                    }))
            }
        });

    } catch (err) {

        console.error("ADMIN STATISTICS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};