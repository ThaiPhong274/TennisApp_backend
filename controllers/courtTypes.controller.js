const pool = require("../config/db");

// ===============================
// GET ACTIVE COURT TYPES
// GET /api/court-types
// ===============================
exports.getCourtTypes = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                type_id,
                type_name,
                price_per_hour,
                is_active
            FROM court_types
            WHERE is_active = true
            ORDER BY type_id ASC
            `
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


// ===============================
// GET ALL COURT TYPES
// INCLUDING ACTIVE + INACTIVE
// GET /api/court-types/all
// ADMIN
// ===============================
exports.getAllCourtTypes = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                type_id,
                type_name,
                price_per_hour,
                is_active
            FROM court_types
            ORDER BY type_id ASC
            `
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


// ===============================
// GET COURT TYPE BY ID
// GET /api/court-types/:id
// ===============================
exports.getCourtTypeById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                type_id,
                type_name,
                price_per_hour,
                is_active
            FROM court_types
            WHERE
                type_id = $1
                AND is_active = true
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Court Type not found"
            });

        }

        return res.status(200).json({
            success: true,
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


// ===============================
// CREATE COURT TYPE
// POST /api/court-types
// ===============================
exports.createCourtType = async (req, res) => {

    try {

        const { type_name, price_per_hour } = req.body;

        // =====================================
        // VALIDATE INPUT
        // =====================================

        if (!type_name || !price_per_hour) {

            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });

        }

        // =====================================
        // CHECK DUPLICATE NAME
        // =====================================

        const check = await pool.query(
            `
            SELECT *
            FROM court_types
            WHERE type_name = $1
            `,
            [type_name]
        );

        if (check.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Court Type already exists"
            });

        }

        // =====================================
        // CREATE
        // =====================================

        const result = await pool.query(
            `
            INSERT INTO court_types
            (
                type_name,
                price_per_hour
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
                type_name,
                price_per_hour
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Create Court Type Success",
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


// ===============================
// UPDATE COURT TYPE
// PUT /api/court-types/:id
// ===============================
exports.updateCourtType = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            type_name,
            price_per_hour
        } = req.body;

        // =====================================
        // VALIDATE INPUT
        // =====================================

        if (!type_name || !price_per_hour) {

            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });

        }

        // =====================================
        // CHECK COURT TYPE
        // =====================================

        const check = await pool.query(
            `
            SELECT *
            FROM court_types
            WHERE type_id = $1
            `,
            [id]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Court Type not found"
            });

        }

        const courtType = check.rows[0];

        // =====================================
        // CANNOT UPDATE DISABLED TYPE
        // =====================================

        if (courtType.is_active === false) {

            return res.status(400).json({
                success: false,
                message: "Court Type has been disabled"
            });

        }

        // =====================================
        // CHECK DUPLICATE NAME
        // =====================================

        const duplicate = await pool.query(
            `
            SELECT *
            FROM court_types
            WHERE
                type_name = $1
                AND type_id <> $2
            `,
            [
                type_name,
                id
            ]
        );

        if (duplicate.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Court Type already exists"
            });

        }

        // =====================================
        // UPDATE
        // =====================================

        const result = await pool.query(
            `
            UPDATE court_types
            SET
                type_name = $1,
                price_per_hour = $2
            WHERE type_id = $3
            RETURNING *
            `,
            [
                type_name,
                price_per_hour,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Update Court Type Success",
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
// DISABLE COURT TYPE
// =====================================
exports.deleteCourtType = async (req, res) => {

    try {

        const { id } = req.params;

        // =====================================
        // CHECK COURT TYPE
        // =====================================

        const check = await pool.query(
            `
            SELECT
                type_id,
                type_name,
                is_active
            FROM court_types
            WHERE type_id = $1
            `,
            [id]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại sân"
            });

        }

        const courtType = check.rows[0];

        // =====================================
        // ALREADY DISABLED
        // =====================================

        if (courtType.is_active === false) {

            return res.status(400).json({
                success: false,
                message: `Loại sân "${courtType.type_name}" đã được ẩn`
            });

        }

        // =====================================
        // CHECK ACTIVE COURTS
        // =====================================

        const activeCourts = await pool.query(
            `
            SELECT
                court_id,
                court_name
            FROM courts
            WHERE
                type_id = $1
                AND is_active = true
            `,
            [id]
        );

        // =====================================
        // CANNOT DISABLE
        // =====================================

        if (activeCourts.rows.length > 0) {

            const courtNames = activeCourts.rows
                .map(court => court.court_name)
                .join(", ");

            return res.status(400).json({
                success: false,
                message:
                    `Bạn không thể ẩn loại sân "${courtType.type_name}" ` +
                    `khi sân "${courtNames}" còn hoạt động.`
            });

        }

        // =====================================
        // DISABLE COURT TYPE
        // =====================================

        await pool.query(
            `
            UPDATE court_types
            SET
                is_active = false
            WHERE type_id = $1
            `,
            [id]
        );

        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({
            success: true,
            message:
                `Ẩn loại sân "${courtType.type_name}" thành công`
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};


// ===============================
// RESTORE COURT TYPE
// PATCH /api/court-types/:id/restore
// ===============================
exports.restoreCourtType = async (req, res) => {

    try {

        const { id } = req.params;

        // =====================================
        // CHECK COURT TYPE
        // =====================================

        const check = await pool.query(
            `
            SELECT
                type_id,
                is_active
            FROM court_types
            WHERE type_id = $1
            `,
            [id]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Court Type not found"
            });

        }

        const courtType = check.rows[0];

        // =====================================
        // ALREADY ACTIVE
        // =====================================

        if (courtType.is_active === true) {

            return res.status(400).json({
                success: false,
                message: "Court Type has already been restored"
            });

        }

        // =====================================
        // RESTORE
        // =====================================

        const result = await pool.query(
            `
            UPDATE court_types
            SET
                is_active = true
            WHERE type_id = $1
            RETURNING *
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Restore Court Type Success",
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