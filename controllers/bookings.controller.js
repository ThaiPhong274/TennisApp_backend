const pool = require("../config/db");
const {
    createNotification
} = require("../services/notifications.service");
// =====================================
// GET ALL BOOKINGS
// =====================================
exports.getAllBookings = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                b.booking_id,
                b.court_id,
                c.court_name,
                ct.type_name,

                b.user_id,
                u.nickname,
                u.email,

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

            ORDER BY b.booking_id DESC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

// =====================================
// GET BOOKING BY ID
// =====================================
exports.getBookingById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                b.booking_id,
                b.court_id,
                c.court_name,
                ct.type_name,

                b.user_id,
                u.nickname,
                u.email,

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

            WHERE b.booking_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = result.rows[0];

        if (
    req.user.role_id !== 1 &&
    booking.user_id !== req.user.user_id
) {
    return res.status(403).json({
        success: false,
        message: "Permission denied"
    });
}

        return res.status(200).json({
    success: true,
    data: booking
});

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

// =====================================
// CREATE BOOKING
// =====================================
exports.createBooking = async (req, res) => {
    try {

        // ==========================================
        // 1. KIỂM TRA USER ĐĂNG NHẬP
        // ==========================================
        //
        // user_id được lấy từ verifyToken
        //
        // Router:
        //
        // router.post(
        //     "/",
        //     verifyToken,
        //     bookingsController.createBooking
        // );
        //
        // Nếu chưa đăng nhập thì request sẽ bị
        // verifyToken chặn trước khi chạy tới đây.
        // ==========================================

        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                success: false,
                message: "Please login to create booking"
            });
        }

        const user_id = req.user.user_id;


        // ==========================================
        // 2. KIỂM TRA REQUEST BODY
        // ==========================================

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is empty"
            });
        }


        // ==========================================
        // 3. LẤY DATA TỪ FLUTTER / POSTMAN
        // ==========================================

        const {
            court_id,
            time_start,
            time_end,
            payment_method
        } = req.body;


        // ==========================================
        // DEBUG REQUEST
        // ==========================================

        console.log("=================================");
        console.log("CREATE BOOKING");
        console.log("REQ.BODY:", req.body);
        console.log("USER ID:", user_id);
        console.log("COURT ID:", court_id);
        console.log("TIME START:", time_start);
        console.log("TIME END:", time_end);
        console.log("PAYMENT METHOD:", payment_method);
        console.log("=================================");


        // ==========================================
        // 4. KIỂM TRA FIELD
        // ==========================================

        if (
            court_id === undefined ||
            court_id === null ||
            court_id === "" ||

            time_start === undefined ||
            time_start === null ||
            time_start === "" ||

            time_end === undefined ||
            time_end === null ||
            time_end === "" ||

            payment_method === undefined ||
            payment_method === null ||
            payment_method === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }


        // ==========================================
        // 5. PAYMENT METHOD
        // ==========================================

        const formattedPaymentMethod =
            payment_method.toString().trim();

        if (
            formattedPaymentMethod !== "Cash" &&
            formattedPaymentMethod !== "Banking"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method. Only Cash or Banking is allowed"
            });
        }


        // ==========================================
        // 6. KIỂM TRA COURT
        // ==========================================

        const courtResult = await pool.query(
            `
            SELECT
                c.court_id,
                c.is_active,
                ct.price_per_hour,
                ct.is_active AS type_active
            FROM courts c

            INNER JOIN court_types ct
                ON c.type_id = ct.type_id

            WHERE c.court_id = $1
            `,
            [court_id]
        );


        // ==========================================
        // 7. COURT KHÔNG TỒN TẠI
        // ==========================================

        if (courtResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Court not found"
            });
        }


        const court = courtResult.rows[0];


        // ==========================================
        // 8. COURT ACTIVE?
        // ==========================================

        if (!court.is_active) {
            return res.status(400).json({
                success: false,
                message: "Court is inactive"
            });
        }


        // ==========================================
        // 9. COURT TYPE ACTIVE?
        // ==========================================

        if (!court.type_active) {
            return res.status(400).json({
                success: false,
                message: "Court Type is inactive"
            });
        }


        // ==========================================
        // 10. CHUYỂN TIME
        //
        // Flutter gửi:
        //
        // 2026-08-21T19:00:00
        //
        // Chuyển thành:
        //
        // 2026-08-21 19:00:00
        //
        // Sau đó ép +07:00
        // ==========================================

        const startString = time_start
            .toString()
            .replace("T", " ")
            .substring(0, 19);

        const endString = time_end
            .toString()
            .replace("T", " ")
            .substring(0, 19);


        console.log("START VN:", startString);
        console.log("END VN:", endString);


        // ==========================================
        // 11. KIỂM TRA FORMAT DATE
        // ==========================================

        const dateRegex =
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;


        if (
            !dateRegex.test(startString) ||
            !dateRegex.test(endString)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format"
            });
        }


        // ==========================================
        // 12. PARSE TIME
        //
        // +07:00 = GIỜ VIỆT NAM
        // ==========================================

        const start = new Date(
            startString.replace(" ", "T") + "+07:00"
        );

        const end = new Date(
            endString.replace(" ", "T") + "+07:00"
        );


        // ==========================================
        // 13. KIỂM TRA DATE HỢP LỆ
        // ==========================================

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format"
            });
        }


        // ==========================================
        // 14. START < END
        // ==========================================

        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }


        // ==========================================
        // 15. KHÔNG CHO ĐẶT QUÁ KHỨ
        // ==========================================

        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: "Cannot book in the past"
            });
        }


        // ==========================================
        // 16. TÍNH SỐ GIỜ
        // ==========================================

        const hours =
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60);


        // ==========================================
        // 17. TỐI THIỂU 1 GIỜ
        // ==========================================

        if (hours < 1) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum booking duration is 1 hour"
            });
        }


        // ==========================================
        // 18. TÍNH TOTAL AMOUNT
        // ==========================================

        const total_amount =
            hours * Number(court.price_per_hour);


        console.log("=================================");
        console.log("BOOKING TIME");
        console.log("START:", start);
        console.log("END:", end);
        console.log("HOURS:", hours);
        console.log("PRICE/HOUR:", court.price_per_hour);
        console.log("TOTAL:", total_amount);
        console.log("=================================");


        // ==========================================
        // 19. KIỂM TRA TRÙNG LỊCH
        //
        // Database:
        // timestamp without time zone
        //
        // Chuyển timestamptz về Asia/Ho_Chi_Minh
        // trước khi so sánh.
        // ==========================================

        const conflict = await pool.query(
            `
            SELECT booking_id

            FROM bookings

            WHERE court_id = $1

            AND booking_status <> 'Cancelled'

            AND (
                time_start < (
                    $3::timestamptz
                    AT TIME ZONE 'Asia/Ho_Chi_Minh'
                )

                AND

                time_end > (
                    $2::timestamptz
                    AT TIME ZONE 'Asia/Ho_Chi_Minh'
                )
            )
            `,
            [
                court_id,
                start.toISOString(),
                end.toISOString()
            ]
        );


        // ==========================================
        // 20. ĐÃ CÓ BOOKING TRÙNG
        // ==========================================

        if (conflict.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Court is already booked for this time"
            });
        }


        // ==========================================
        // 21. INSERT BOOKING
        // ==========================================

        const result = await pool.query(
            `
            INSERT INTO bookings
            (
                court_id,
                user_id,
                time_start,
                time_end,
                total_amount,
                payment_method,
                payment_status,
                booking_status
            )

            VALUES
            (
                $1,
                $2,

                (
                    $3::timestamptz
                    AT TIME ZONE 'Asia/Ho_Chi_Minh'
                ),

                (
                    $4::timestamptz
                    AT TIME ZONE 'Asia/Ho_Chi_Minh'
                ),

                $5,
                $6,
                $7,
                $8
            )

            RETURNING *
            `,
            [
                court_id,
                user_id,

                start.toISOString(),
                end.toISOString(),

                total_amount,

                formattedPaymentMethod,

                "Pending",

                "Pending"
            ]
        );


        // ==========================================
        // 22. LẤY BOOKING VỪA TẠO
        // ==========================================

        const booking = result.rows[0];


        console.log("=================================");
        console.log("BOOKING CREATED SUCCESSFULLY");
        console.log("BOOKING ID:", booking.booking_id);
        console.log("USER ID:", booking.user_id);
        console.log("COURT ID:", booking.court_id);
        console.log("TIME START:", booking.time_start);
        console.log("TIME END:", booking.time_end);
        console.log("TOTAL:", booking.total_amount);
        console.log("PAYMENT:", booking.payment_method);
        console.log("PAYMENT STATUS:", booking.payment_status);
        console.log("BOOKING STATUS:", booking.booking_status);
        console.log("=================================");


        // ==========================================
        // 23. TẠO NOTIFICATION CHO USER
        //
        // Chỉ tạo 1 notification.
        //
        // is_read = FALSE
        //
        // Notification sẽ xuất hiện ở
        // NotificationsPage.
        // ==========================================

        try {

            await pool.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    notification_type,
                    is_read
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    FALSE
                )
                `,
                [
                    user_id,

                    "Đặt sân thành công",

                    `Bạn đã đặt sân thành công. Mã đặt sân #${booking.booking_id}.`,

                    "Booking"
                ]
            );


            console.log(
                "✅ USER NOTIFICATION CREATED"
            );

        } catch (notificationError) {

            // ==========================================
            // QUAN TRỌNG:
            //
            // Notification lỗi KHÔNG làm booking thất bại.
            //
            // Booking vẫn được tạo thành công.
            // ==========================================

            console.error(
                "❌ CREATE USER NOTIFICATION ERROR:"
            );

            console.error(notificationError);
        }


        // ==========================================
        // 24. RESPONSE
        // ==========================================

        return res.status(201).json({
            success: true,

            message:
                "Booking created successfully",

            data: booking
        });


    } catch (err) {

        // ==========================================
        // 25. SERVER ERROR
        // ==========================================

        console.error("=================================");
        console.error("CREATE BOOKING ERROR");
        console.error(err);
        console.error("=================================");


        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

// =====================================
// GET BOOKINGS BY COURT & DATE
// =====================================
exports.getBookingsByCourt = async (req, res) => {
    try {

        const { courtId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required"
            });
        }

        const result = await pool.query(
            `
            SELECT
                booking_id,
                time_start,
                time_end,
                booking_status
            FROM bookings
            WHERE court_id = $1
                AND booking_status <> 'Cancelled'
                AND DATE(time_start) = $2
            ORDER BY time_start ASC
            `,
            [
                courtId,
                date
            ]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

// =====================================
// UPDATE BOOKING
// =====================================
exports.updateBooking = async (req, res) => {

    try {

        const booking_id = req.params.id;

        const user_id = req.user.user_id;

        const role_id = req.user.role_id;


        const {
            time_start,
            time_end,
            payment_method
        } = req.body;



        // ================================
        // Validate input
        // ================================

        if (
            !time_start ||
            !time_end ||
            !payment_method
        ) {

            return res.status(400).json({
                success:false,
                message:"Please fill all fields"
            });

        }



        // ================================
        // Chuẩn hóa payment method
        // cash -> Cash
        // momo -> Momo
        // banking -> Banking
        // ================================

        const formattedPaymentMethod =
            payment_method.charAt(0).toUpperCase()
            +
            payment_method.slice(1).toLowerCase();





        // ================================
        // Kiểm tra booking tồn tại
        // ================================

        const bookingResult = await pool.query(
            `
            SELECT
    b.booking_id,
    b.user_id,
    b.court_id,
    b.booking_status,

    c.is_active,

    ct.price_per_hour,
    ct.is_active AS type_active
            FROM bookings b

            INNER JOIN courts c
            ON b.court_id = c.court_id

            INNER JOIN court_types ct
            ON c.type_id = ct.type_id

            WHERE b.booking_id = $1
            `,
            [
                booking_id
            ]
        );



        if (bookingResult.rows.length === 0) {

            return res.status(404).json({
                success:false,
                message:"Booking not found"
            });

        }



        const booking = bookingResult.rows[0];

if (!booking.type_active) {

    return res.status(400).json({
        success: false,
        message: "Court Type is inactive"
    });

}
if (!booking.is_active) {

    return res.status(400).json({
        success: false,
        message: "Court is inactive"
    });

}x

        // ================================
// Chỉ cho phép sửa khi Pending
// ================================

if (
    booking.booking_status === "Confirmed" ||
    booking.booking_status === "Completed" ||
    booking.booking_status === "Cancelled"
) {

    return res.status(400).json({
        success: false,
        message: "This booking cannot be updated"
    });

}





        // ================================
        // Check quyền
        // Chủ booking hoặc Admin
        // ================================

        if (
            booking.user_id != user_id &&
            role_id != 1
        ) {

            return res.status(403).json({
                success:false,
                message:"Permission denied"
            });

        }




        // ================================
        // Check thời gian
        // ================================

        const start = new Date(time_start);

        const end = new Date(time_end);

const now = new Date();

if (start < now) {

    return res.status(400).json({
        success: false,
        message: "Cannot book in the past"
    });

}

        if(start >= end){

            return res.status(400).json({
                success:false,
                message:"End time must be after start time"
            });

        }




        // ================================
        // Tính tiền
        // ================================

        const hours =
            (end - start)
            /
            (1000 * 60 * 60);



        if (hours < 1) {

    return res.status(400).json({
        success: false,
        message: "Minimum booking duration is 1 hour"
    });

}


        const total_amount =
            hours * booking.price_per_hour;




        // ================================
        // Check trùng lịch
        // ================================

        const conflict = await pool.query(
            `
            SELECT booking_id

            FROM bookings

            WHERE court_id = $1

            AND booking_id <> $2

            AND booking_status <> 'Cancelled'

            AND (
                time_start < $4
                AND time_end > $3
            )

            `,
            [
                booking.court_id,
                booking_id,
                time_start,
                time_end
            ]
        );



        if(conflict.rows.length > 0){

            return res.status(400).json({
                success:false,
                message:"Court is already booked for this time"
            });

        }




        // ================================
        // Update booking
        // ================================

        const result = await pool.query(
            `
            UPDATE bookings

            SET

            time_start = $1,

            time_end = $2,

            total_amount = $3,

            payment_method = $4,

            updated_at = CURRENT_TIMESTAMP


            WHERE booking_id = $5


            RETURNING *

            `,
            [
                time_start,
                time_end,
                total_amount,
                formattedPaymentMethod,
                booking_id
            ]
        );



        return res.status(200).json({

            success:true,

            message:"Booking updated successfully",

            data:result.rows[0]

        });



    } catch(err){

        console.log(err);


        return res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

};

// =====================================
// CANCEL BOOKING
// =====================================
exports.cancelBooking = async (req, res) => {

    try {

        const booking_id = req.params.id;
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        // =====================================
        // Kiểm tra booking có tồn tại
        // =====================================
        const bookingResult = await pool.query(
            `
            SELECT
                booking_id,
                user_id,
                booking_status
            FROM bookings
            WHERE booking_id = $1
            `,
            [booking_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingResult.rows[0];

        // =====================================
        // Chỉ chủ booking hoặc Admin mới được hủy
        // =====================================
        if (
            booking.user_id != user_id &&
            role_id != 1
        ) {
            return res.status(403).json({
                success: false,
                message: "Permission denied"
            });
        }

        // =====================================
        // Chỉ cho phép hủy Pending hoặc Confirmed
        // =====================================
        if (
            booking.booking_status !== "Pending" &&
            booking.booking_status !== "Confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel booking with status '${booking.booking_status}'`
            });
        }

        // =====================================
        // Cập nhật trạng thái
        // =====================================
        const result = await pool.query(
            `
            UPDATE bookings
            SET
                booking_status = 'Cancelled',
                updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $1
            RETURNING *
            `,
            [booking_id]
        );

        // Kiểm tra UPDATE thành công
        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cancel booking failed"
            });
        }

        // =====================================
        // Thành công
        // =====================================
        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: result.rows[0]
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

//------------------------------------
// CONFIRM BOOKING (ADMIN)
//------------------------------------
exports.confirmBooking = async (req, res) => {
    try {
        const booking_id = req.params.id;

        // =====================================
        // 1. KIỂM TRA BOOKING
        // =====================================

        const bookingResult = await pool.query(
            `
            SELECT
                booking_id,
                booking_status,
                payment_method,
                payment_status
            FROM bookings
            WHERE booking_id = $1
            `,
            [booking_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingResult.rows[0];

        // =====================================
        // 2. CHỈ PENDING MỚI ĐƯỢC CONFIRM
        // =====================================

        if (booking.booking_status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot confirm booking with status '${booking.booking_status}'`
            });
        }

        // =====================================
        // 3. CONFIRM BOOKING
        // =====================================

        const result = await pool.query(
            `
            UPDATE bookings
            SET
                booking_status = 'Confirmed',
                updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $1
            RETURNING *
            `,
            [booking_id]
        );

        return res.status(200).json({
            success: true,
            message: "Booking confirmed successfully",
            data: result.rows[0]
        });

    } catch (err) {

        console.error("CONFIRM BOOKING ERROR:");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

//------------------------------------
// COMPLETE BOOKING (ADMIN)
//------------------------------------
exports.completeBooking = async (req, res) => {
    try {
        const booking_id = req.params.id;

        // =====================================
        // 1. KIỂM TRA BOOKING
        // =====================================

        const bookingResult = await pool.query(
            `
            SELECT
                booking_id,
                booking_status,
                payment_status,
                payment_method
            FROM bookings
            WHERE booking_id = $1
            `,
            [booking_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingResult.rows[0];

        // =====================================
        // 2. CHỈ CONFIRMED MỚI ĐƯỢC COMPLETE
        // =====================================

        if (booking.booking_status !== "Confirmed") {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot complete booking with status '${booking.booking_status}'`
            });
        }

        // =====================================
        // 3. COMPLETE BOOKING
        // =====================================

        const result = await pool.query(
            `
            UPDATE bookings
            SET
                booking_status = 'Completed',
                payment_status = 'Paid',
                updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $1
            RETURNING *
            `,
            [booking_id]
        );

        // =====================================
        // 4. SUCCESS
        // =====================================

        return res.status(200).json({
            success: true,
            message: "Booking completed successfully",
            data: result.rows[0]
        });

    } catch (err) {

        console.error("COMPLETE BOOKING ERROR:");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

// =====================================
// GET MY BOOKINGS
// =====================================
exports.getMyBookings = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                b.booking_id,

                b.court_id,
                c.court_name,
                c.description,
                c.image AS court_image,

                ct.type_id,
                ct.type_name,
                ct.price_per_hour,

                b.time_start,
                b.time_end,

                b.total_amount,

                b.payment_method,
                b.payment_status,
                b.booking_status,

                b.created_at,
                b.updated_at

            FROM bookings b

            INNER JOIN courts c
                ON b.court_id = c.court_id

            INNER JOIN court_types ct
                ON c.type_id = ct.type_id

            WHERE b.user_id = $1

            ORDER BY
                b.time_start DESC
            `,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
            error: err
        });

    }

};