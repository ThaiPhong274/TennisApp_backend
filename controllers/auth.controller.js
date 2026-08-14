const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isEmpty
} = require("../middleware/validation.middleware");
/**
 * REGISTER
 */
exports.register = async (req, res) => {
    try {
        const {
            nickname,
            email,
            phonenumber,
            password
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (
    isEmpty(nickname) ||
    isEmpty(email) ||
    isEmpty(phonenumber) ||
    isEmpty(password)
) {

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
if (!isValidPhone(phonenumber)) {

    return res.status(400).json({

        success: false,

        message: "Invalid phone number"

    });

}
if (!isValidPassword(password)) {

    return res.status(400).json({

        success: false,

        message: "Password must be at least 6 characters and contain letters and numbers"

    });

}

        // Kiểm tra email đã tồn tại
        const checkEmail = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (checkEmail.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm user mới
        const result = await pool.query(
            `
            INSERT INTO users
            (
                nickname,
                email,
                phonenumber,
                password,
                is_active,
                role_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                true,
                2
            )
            RETURNING
                user_id,
                nickname,
                email,
                phonenumber,
                is_active,
                role_id,
                google_id,
                auth_provider,
                avatar_image
            `,
            [
                nickname,
                email,
                phonenumber,
                hashedPassword
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Register Success",
            data: result.rows[0]
        });

    } catch (err) {
    console.error("REGISTER ERROR:");
    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Server Error",
        error: err.message,
    });
}
};

/**
 * LOGIN
 */
exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Tìm user theo email
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Email not found"
            });
        }

        const user = result.rows[0];
// Kiểm tra tài khoản có bị khóa không
if (!user.is_active) {
    return res.status(403).json({
        success: false,
        message: "Your account has been locked. Please contact administrator."
    });
}
        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Wrong password"
            });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        // Trả kết quả
        return res.status(200).json({
            success: true,
            message: "Login Success",
            token,
            user: {
                user_id: user.user_id,
                nickname: user.nickname,
                email: user.email,
                phonenumber: user.phonenumber,
                role_id: user.role_id,
                avatar_image: user.avatar_image
            }
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });

    }

};