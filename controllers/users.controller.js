const pool = require("../config/db");
const sendMail = require("../utils/sendMail");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const {
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isEmpty,
} = require("../middleware/validation.middleware");


// =====================================
// USER PROFILE
// GET /api/users/profile
// =====================================

exports.profile = async (req, res) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userId = req.user.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID không tồn tại"
            });
        }

        const result = await pool.query(
            `
            SELECT
                u.user_id,
                u.nickname,
                u.email,
                u.phonenumber,
                u.role_id,
                u.is_active,
                u.avatar_image
            FROM users u
            WHERE u.user_id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {

        console.log("====================================");
        console.log("GET PROFILE ERROR");
        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);
        console.log("DETAIL:", err.detail);
        console.log("STACK:", err.stack);
        console.log("====================================");

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =====================================
// LOCK USER (ADMIN)
// =====================================
exports.lockUser = async (req, res) => {

    try {

        const user_id = req.params.id;

        // Không cho khóa chính mình
        if (Number(user_id) === Number(req.user.user_id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot lock your own account"
            });
        }

        // Kiểm tra user tồn tại
        const userResult = await pool.query(
            `
            SELECT
                user_id,
                nickname,
                email,
                is_active,
                role_id
            FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // Đã khóa
        if (user.is_active === false) {
            return res.status(400).json({
                success: false,
                message: "User has already been locked"
            });
        }

        // Khóa tài khoản
        const result = await pool.query(
            `
            UPDATE users
            SET
                is_active = false
            WHERE user_id = $1
            RETURNING
                user_id,
                nickname,
                email,
                is_active,
                role_id
            `,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            message: "User locked successfully",
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

// =====================================
// UNLOCK USER (ADMIN)
// =====================================
exports.unlockUser = async (req, res) => {

    try {

        const user_id = req.params.id;

        // Kiểm tra user tồn tại
        const userResult = await pool.query(
            `
            SELECT
                user_id,
                nickname,
                email,
                is_active,
                role_id
            FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // Đã mở khóa
        if (user.is_active === true) {
            return res.status(400).json({
                success: false,
                message: "User has already been unlocked"
            });
        }

        // Mở khóa
        const result = await pool.query(
            `
            UPDATE users
            SET
                is_active = true
            WHERE user_id = $1
            RETURNING
                user_id,
                nickname,
                email,
                is_active,
                role_id
            `,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            message: "User unlocked successfully",
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

exports.sendMailTest = async (req, res) => {

    try {
        const {emailTo, subject ,htmlContent} = req.body;
        await sendMail(emailTo, subject, htmlContent);


        return res.status(200).json({
            success: true,
            data: null
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
// UPLOAD AVATAR
// =====================================
exports.uploadAvatar = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please select an image"
            });

        }

        const userResult = await pool.query(
            `
            SELECT avatar_image
            FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        if (userResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        const oldAvatar = userResult.rows[0].avatar_image;

        if (oldAvatar) {

            const oldPath = path.join(
                __dirname,
                "..",
                oldAvatar
            );

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const avatarPath =
            "/uploads/users/" + req.file.filename;

        const result = await pool.query(
            `
            UPDATE users
            SET avatar_image = $1
            WHERE user_id = $2
            RETURNING
                user_id,
                nickname,
                email,
                phonenumber,
                avatar_image,
                role_id,
                is_active
            `,
            [
                avatarPath,
                user_id
            ]
        );

        return res.status(200).json({

            success: true,

            message: "Upload avatar successfully",

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

// =====================================
// UPDATE PROFILE
// =====================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            nickname,
            email,
            phonenumber
        } = req.body || {};

        // =====================================================
        // CHECK BODY
        // =====================================================

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body không tồn tại"
            });
        }

        // =====================================================
        // CHECK REQUIRED
        // =====================================================

        if (!nickname || !nickname.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nickname không được để trống"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email không được để trống"
            });
        }

        // =====================================================
        // CHECK EMAIL
        // =====================================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Email không hợp lệ"
            });
        }

        // =====================================================
        // CHECK EMAIL TRÙNG
        // =====================================================

        const checkEmail = await pool.query(
            `
            SELECT user_id
            FROM users
            WHERE email = $1
              AND user_id <> $2
            `,
            [
                email.trim(),
                userId
            ]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email đã được sử dụng"
            });
        }

        // =====================================================
        // UPDATE
        // =====================================================

        const result = await pool.query(
            `
            UPDATE users
            SET
                nickname = $1,
                email = $2,
                phonenumber = $3
            WHERE user_id = $4
            RETURNING
    user_id,
    nickname,
    email,
    phonenumber,
    role_id,
    is_active,
    avatar_image
            `,
            [
                nickname.trim(),
                email.trim(),
                phonenumber?.trim() || null,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        // =====================================================
        // SUCCESS
        // =====================================================

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: result.rows[0]
        });

    } catch (err) {

        console.log("====================================");
        console.log("UPDATE PROFILE ERROR");
        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);
        console.log("DETAIL:", err.detail);
        console.log("STACK:", err.stack);
        console.log("====================================");

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =====================================
// CHANGE PASSWORD
// =====================================
exports.changePassword = async (req, res) => {
    try {
        // =====================================
        // USER ID
        // =====================================
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // =====================================
        // REQUEST BODY
        // =====================================
        const { oldPassword, newPassword } = req.body;

        // =====================================
        // VALIDATE
        // =====================================
        if (isEmpty(oldPassword) || isEmpty(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters and contain letters and numbers"
            });
        }

        // =====================================
        // NEW PASSWORD MUST DIFFERENT
        // =====================================
        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password"
            });
        }

        // =====================================
        // GET CURRENT USER
        // =====================================
        const userResult = await pool.query(
            `
            SELECT
                user_id,
                password
            FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // =====================================
        // CHECK OLD PASSWORD
        // =====================================
        const isMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        // =====================================
        // HASH NEW PASSWORD
        // =====================================
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        // =====================================
        // UPDATE PASSWORD
        // =====================================
        await pool.query(
            `
            UPDATE users
            SET password = $1
            WHERE user_id = $2
            `,
            [
                hashedPassword,
                user_id
            ]
        );

        // =====================================
        // SUCCESS
        // =====================================
        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// =====================================
// FORGOT PASSWORD
// =====================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
console.log("typeof isEmpty =", typeof isEmpty);
        if (isEmpty(email)) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

       
        // ============================
        // Kiểm tra email
        // ============================

        const userResult = await pool.query(
            `
            SELECT
                user_id,
                email,
                is_active
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        if (userResult.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Email not found"

            });

        }

        const user = userResult.rows[0];

        if (!user.is_active) {

            return res.status(400).json({

                success: false,

                message: "Account has been locked"

            });

        }

        // ============================
        // Sinh OTP
        // ============================

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // ============================
        // Hết hạn sau 5 phút
        // ============================

        const expired = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // ============================
        // Lưu OTP
        // ============================

        await pool.query(
            `
            UPDATE users

            SET

                otp_code = $1,

                otp_expired = $2

            WHERE email = $3
            `,
            [
                otp,
                expired,
                email
            ]
        );

        // ============================
        // Nội dung email
        // ============================

        const subject = "Reset Password OTP";

        const html = `
            <h2>Tennis Booking</h2>

            <p>Your OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP will expire in 5 minutes.</p>
        `;

        // ============================
// Gửi mail
// ============================

const result = await sendMail(
    email,
    subject,
    html
);

console.log("Send mail result:", result);

return res.status(200).json({
    success: true,
    message: "OTP has been sent to your email"
});

    } catch (err) {

    console.error("========== FORGOT PASSWORD ==========");
    console.error(err);

    return res.status(500).json({
        success: false,
        message: err.message,
        error: err.stack,
    });

}

};

// =====================================
// VERIFY OTP
// =====================================
exports.verifyOTP = async (req, res) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        // ============================
        // Validate
        // ============================

        if (isEmpty(email) ||
    isEmpty(otp) ||
    isEmpty(newPassword)) {

    return res.status(400).json({

        success: false,

        message: "Please fill all fields"

    });

}
if (!isValidEmail(email)) {

    return res.status(400).json({

        success: false,

        message: "Invalid email"

    });

}

if (!isValidPassword(newPassword)) {

    return res.status(400).json({

        success: false,

        message: "Password must be at least 6 characters and contain letters and numbers"

    });

}

        // ============================
        // Kiểm tra email
        // ============================

        const result = await pool.query(
            `
            SELECT
    user_id,
    password,
    otp_code,
    otp_expired,
    is_active
FROM users
WHERE email = $1
            `,
            [email]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Email not found"

            });

        }

        const user = result.rows[0];

        if (!user.is_active) {

    return res.status(400).json({

        success: false,

        message: "Account has been locked"

    });

}

        // ============================
        // Chưa gửi OTP
        // ============================

        if (!user.otp_code) {

            return res.status(400).json({

                success: false,

                message: "OTP has not been generated"

            });

        }

        // ============================
        // Sai OTP
        // ============================

        if (user.otp_code !== otp) {

            return res.status(400).json({

                success: false,

                message: "Invalid OTP"

            });

        }

        // ============================
        // OTP hết hạn
        // ============================

        if (new Date() > new Date(user.otp_expired)) {

            return res.status(400).json({

                success: false,

                message: "OTP has expired"

            });

        }

const isSamePassword = await bcrypt.compare(
    newPassword,
    user.password
);

if (isSamePassword) {

    return res.status(400).json({

        success: false,

        message: "New password must be different from old password"

    });

}

const hashedPassword = await bcrypt.hash(
    newPassword,
    10
);

await pool.query(
    `
    UPDATE users

    SET
        password = $1,
        otp_code = NULL,
        otp_expired = NULL

    WHERE email = $2
    `,
    [
        hashedPassword,
        email
    ]
);




        return res.status(200).json({

    success: true,

    message: "Password reset successfully"

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
// GET ALL USERS - ADMIN
// =====================================

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.user_id,
                u.nickname,
                u.email,
                u.phonenumber,
                u.role_id,
                u.is_active
            FROM users u
            ORDER BY u.user_id ASC
        `);

        console.log("========================================");
        console.log("GET ALL USERS SUCCESS");
        console.log("TOTAL USERS:", result.rows.length);
        console.log("DATA:", result.rows);
        console.log("========================================");

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("========================================");
        console.error("GET ALL USERS ERROR");
        console.error("message:", err.message);
        console.error("code:", err.code);
        console.error("detail:", err.detail);
        console.error("hint:", err.hint);
        console.error("position:", err.position);
        console.error("========================================");

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// ============================================================
// ADMIN - UPDATE USER STATUS
// PUT /api/users/:id/status
// ============================================================

exports.updateUserStatus = async (req, res) => {
    try {
        // ============================================================
        // DEBUG REQUEST
        // ============================================================

        console.log("====================================");
        console.log("UPDATE USER STATUS REQUEST");
        console.log("PARAMS:", req.params);
        console.log("BODY:", req.body);
        console.log(
            "CONTENT-TYPE:",
            req.headers["content-type"]
        );
        console.log("====================================");

        // ============================================================
        // GET USER ID
        // ============================================================

        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: "User ID không hợp lệ"
            });
        }

        // ============================================================
        // CHECK REQUEST BODY
        // ============================================================

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body không tồn tại"
            });
        }

        // ============================================================
        // GET is_active
        // ============================================================

        let isActive = req.body.is_active;

        console.log("RAW is_active:", isActive);
        console.log(
            "RAW TYPE:",
            typeof isActive
        );

        // ============================================================
        // CONVERT STRING -> BOOLEAN
        // ============================================================

        if (typeof isActive === "string") {
            const value = isActive.trim().toLowerCase();

            if (value === "true") {
                isActive = true;
            } else if (value === "false") {
                isActive = false;
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        "is_active phải là true hoặc false"
                });
            }
        }

        // ============================================================
        // CHECK BOOLEAN
        // ============================================================

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message:
                    "is_active phải là true hoặc false"
            });
        }

        // ============================================================
        // CHECK USER EXISTS
        // ============================================================

        const checkUser = await pool.query(
            `
            SELECT
                user_id,
                nickname,
                email,
                phonenumber,
                role_id,
                is_active
            FROM users
            WHERE user_id = $1
            `,
            [userId]
        );

        if (checkUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        const currentUser = checkUser.rows[0];

        // ============================================================
        // KHÔNG CHO TỰ KHÓA CHÍNH MÌNH
        // ============================================================

        if (
            req.user &&
            Number(req.user.user_id) === userId &&
            isActive === false
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Bạn không thể tự khóa tài khoản của mình"
            });
        }

        // ============================================================
        // UPDATE DATABASE
        // ============================================================

        const result = await pool.query(
            `
            UPDATE users
            SET is_active = $1
            WHERE user_id = $2
            RETURNING
                user_id,
                nickname,
                email,
                phonenumber,
                role_id,
                is_active
            `,
            [
                isActive,
                userId
            ]
        );

        // ============================================================
        // CHECK UPDATE
        // ============================================================

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Không thể cập nhật trạng thái tài khoản"
            });
        }

        // ============================================================
        // SUCCESS MESSAGE
        // ============================================================

        const message = isActive
            ? "Mở khóa tài khoản thành công"
            : "Khóa tài khoản thành công";

        console.log(
            `USER ${userId} STATUS: ${currentUser.is_active} -> ${isActive}`
        );

        // ============================================================
        // RESPONSE
        // ============================================================

        return res.status(200).json({
            success: true,
            message: message,
            data: result.rows[0]
        });

    } catch (err) {

        // ============================================================
        // ERROR LOG
        // ============================================================

        console.log("====================================");
        console.log("UPDATE USER STATUS ERROR");
        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);
        console.log("DETAIL:", err.detail);
        console.log("STACK:", err.stack);
        console.log("====================================");

        // ============================================================
        // ERROR RESPONSE
        // ============================================================

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ============================================================
// ADMIN - RESET USER PASSWORD
// PUT /api/users/:id/reset-password
// ============================================================

exports.resetUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // ========================================================
        // CHECK USER ID
        // ========================================================

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: "User ID không hợp lệ"
            });
        }

        // ========================================================
        // CHECK USER
        // ========================================================

        const userResult = await pool.query(
            `
            SELECT
                user_id,
                nickname,
                email,
                role_id,
                is_active
            FROM users
            WHERE user_id = $1
            `,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        const user = userResult.rows[0];

        // ========================================================
        // KHÔNG CHO RESET ADMIN
        // ========================================================

        if (Number(user.role_id) === 1) {
            return res.status(403).json({
                success: false,
                message: "Không thể reset mật khẩu Admin"
            });
        }

        // ========================================================
        // MẬT KHẨU MẶC ĐỊNH
        // ========================================================

        const defaultPassword = "123456";

        // ========================================================
        // HASH PASSWORD
        // ========================================================

        const hashedPassword = await bcrypt.hash(
            defaultPassword,
            10
        );

        // ========================================================
        // UPDATE
        // ========================================================

        const result = await pool.query(
            `
            UPDATE users
            SET password = $1
            WHERE user_id = $2
            RETURNING
                user_id,
                nickname,
                email,
                role_id,
                is_active
            `,
            [
                hashedPassword,
                userId
            ]
        );

        // ========================================================
        // SUCCESS
        // ========================================================

        return res.status(200).json({
            success: true,
            message: "Reset mật khẩu thành công",
            data: {
                user_id: result.rows[0].user_id,
                nickname: result.rows[0].nickname,
                email: result.rows[0].email,
                role_id: result.rows[0].role_id,
                is_active: result.rows[0].is_active,
                default_password: defaultPassword
            }
        });

    } catch (err) {

        console.error(
            "RESET USER PASSWORD ERROR:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ============================================================
// ADMIN - DELETE USER
// DELETE /api/users/:id
// ============================================================

exports.deleteUser = async (req, res) => {
    try {

        // ========================================================
        // GET USER ID
        // ========================================================

        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: "User ID không hợp lệ"
            });
        }


        // ========================================================
        // KHÔNG CHO ADMIN TỰ XÓA MÌNH
        // ========================================================

        if (
            req.user &&
            Number(req.user.user_id) === userId
        ) {
            return res.status(400).json({
                success: false,
                message: "Bạn không thể tự xóa tài khoản của mình"
            });
        }


        // ========================================================
        // CHECK USER EXISTS
        // ========================================================

        const userResult = await pool.query(
            `
            SELECT
                user_id,
                nickname,
                email,
                role_id,
                is_active
            FROM users
            WHERE user_id = $1
            `,
            [userId]
        );


        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }


        const user = userResult.rows[0];


        // ========================================================
        // DELETE USER
        // ========================================================

        const result = await pool.query(
            `
            DELETE FROM users
            WHERE user_id = $1
            RETURNING
                user_id,
                nickname,
                email
            `,
            [userId]
        );


        // ========================================================
        // SUCCESS
        // ========================================================

        return res.status(200).json({
            success: true,
            message: "Xóa người dùng thành công",
            data: result.rows[0]
        });

    } catch (err) {

        console.log("====================================");
        console.log("DELETE USER ERROR");
        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);
        console.log("DETAIL:", err.detail);
        console.log("STACK:", err.stack);
        console.log("====================================");

        return res.status(500).json({
            success: false,
            message: "Không thể xóa người dùng"
        });
    }
};