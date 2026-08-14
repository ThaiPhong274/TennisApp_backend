const pool = require("../config/db");

// ============================================================
// CREATE NOTIFICATION
// ============================================================

const createNotification = async ({
    userId,
    title,
    message,
    notificationType = "System"
}) => {
    try {
        const result = await pool.query(
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
            RETURNING
                notification_id,
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at
            `,
            [
                userId,
                title,
                message,
                notificationType
            ]
        );

        return result.rows[0];

    } catch (error) {
        console.error(
            "CREATE NOTIFICATION ERROR:",
            error
        );

        throw error;
    }
};


module.exports = {
    createNotification
};