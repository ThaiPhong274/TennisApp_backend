const pool = require("../config/db");

// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ============================================================

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT
                notification_id,
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("GET MY NOTIFICATIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách thông báo"
        });
    }
};


// ============================================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// ============================================================

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM notifications
            WHERE user_id = $1
              AND is_read = FALSE
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: {
                count: Number(result.rows[0].count)
            }
        });

    } catch (error) {
        console.error("GET UNREAD COUNT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể lấy số lượng thông báo chưa đọc"
        });
    }
};


// ============================================================
// MARK AS READ
// PATCH /api/notifications/:id/read
// ============================================================

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const notificationId = req.params.id;

        const result = await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE notification_id = $1
              AND user_id = $2
            RETURNING
                notification_id,
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at
            `,
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Đã đánh dấu thông báo là đã đọc",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("MARK NOTIFICATION READ ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật thông báo"
        });
    }
};


// ============================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// ============================================================

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;

        await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = $1
              AND is_read = FALSE
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Đã đánh dấu tất cả thông báo là đã đọc"
        });

    } catch (error) {
        console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật thông báo"
        });
    }
};


// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const notificationId = req.params.id;

        const result = await pool.query(
            `
            DELETE FROM notifications
            WHERE notification_id = $1
              AND user_id = $2
            RETURNING notification_id
            `,
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Đã xóa thông báo"
        });

    } catch (error) {
        console.error("DELETE NOTIFICATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể xóa thông báo"
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};