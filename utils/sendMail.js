const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // true nếu port 465
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/**
 * Gửi Email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
const sendMail = async (to, subject, html) => {
    const info = await transporter.sendMail({
        from: `"Tennis Booking" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    });

    console.log("Email sent:", info.messageId);

    return info;
};

module.exports = sendMail;
