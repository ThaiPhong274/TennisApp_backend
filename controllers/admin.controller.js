const pool = require("../config/db");

// =====================================
// ADMIN DASHBOARD
// =====================================
exports.getDashboard = async (req, res) => {

    try {

        // Tổng user
        const totalUsers = await pool.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);

        // Tổng sân
        const totalCourts = await pool.query(`
            SELECT COUNT(*) AS total
            FROM courts
        `);

        // Tổng booking
        const totalBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
        `);

        // Pending
        const pendingBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Pending'
        `);

        // Confirmed
        const confirmedBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Confirmed'
        `);

        // Completed
        const completedBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Completed'
        `);

        // Cancelled
        const cancelledBookings = await pool.query(`
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE booking_status = 'Cancelled'
        `);

        // Doanh thu hôm nay
        const todayRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount),0) AS total
            FROM bookings
            WHERE booking_status='Completed'
            AND DATE(updated_at)=CURRENT_DATE
        `);

        // Doanh thu tháng
        const monthRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount),0) AS total
            FROM bookings
            WHERE booking_status='Completed'
            AND DATE_TRUNC('month',updated_at)=DATE_TRUNC('month',CURRENT_DATE)
        `);

        // Doanh thu năm
        const yearRevenue = await pool.query(`
            SELECT
                COALESCE(SUM(total_amount),0) AS total
            FROM bookings
            WHERE booking_status='Completed'
            AND DATE_TRUNC('year',updated_at)=DATE_TRUNC('year',CURRENT_DATE)
        `);
// =====================================
// RECENT BOOKINGS
// =====================================

const recentBookings = await pool.query(`
    SELECT
        b.booking_id,
        b.user_id,
        u.nickname,

        b.court_id,
        c.court_name,
        ct.type_name,

        b.time_start,
        b.time_end,

        b.total_amount,

        b.payment_method,
        b.payment_status,
        b.booking_status,

        b.created_at,
        b.updated_at

    FROM bookings b

    INNER JOIN users u
        ON b.user_id = u.user_id

    INNER JOIN courts c
        ON b.court_id = c.court_id

    INNER JOIN court_types ct
        ON c.type_id = ct.type_id

    ORDER BY b.created_at DESC

    LIMIT 5
`);
        return res.status(200).json({
            success: true,
            data: {
                total_users: Number(totalUsers.rows[0].total),
                total_courts: Number(totalCourts.rows[0].total),
                total_bookings: Number(totalBookings.rows[0].total),

                pending_bookings: Number(pendingBookings.rows[0].total),
                confirmed_bookings: Number(confirmedBookings.rows[0].total),
                completed_bookings: Number(completedBookings.rows[0].total),
                cancelled_bookings: Number(cancelledBookings.rows[0].total),

                today_revenue: Number(todayRevenue.rows[0].total),
                month_revenue: Number(monthRevenue.rows[0].total),
                year_revenue: Number(yearRevenue.rows[0].total),

recent_bookings: recentBookings.rows
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