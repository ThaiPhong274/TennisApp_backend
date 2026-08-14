const pool = require("../config/db");

exports.getHomeCourts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
    c.court_id,
    c.court_name,
    c.description,
    c.image,
    c.is_active,

    ct.type_name,
    ct.price_per_hour,

    active_booking.booking_id,
    active_booking.time_start,
    active_booking.time_end,

                CASE
                    WHEN active_booking.booking_id IS NULL
                        THEN 'Available'
                    ELSE 'Busy'
                END AS status

            FROM courts c

            LEFT JOIN court_types ct
            ON c.type_id = ct.type_id

            LEFT JOIN LATERAL (

                SELECT
                    booking_id,
                    time_start,
                    time_end

                FROM bookings

                WHERE court_id = c.court_id
                    AND booking_status = 'Confirmed'
                    AND CURRENT_TIMESTAMP >= time_start
                    AND CURRENT_TIMESTAMP <= time_end

                ORDER BY time_start
                LIMIT 1

            ) active_booking
            ON TRUE

            ORDER BY c.court_id;
        `);

        //--------------------------------------
        // Chuyển image thành URL đầy đủ
        //--------------------------------------

        const host = `${req.protocol}://${req.get("host")}`;

const courts = result.rows.map((court) => ({
    ...court,
    image: court.image
        ? `${host}/uploads/courts/${court.image}`
        : "",
}));

        return res.status(200).json({
            success: true,
            data: courts,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};