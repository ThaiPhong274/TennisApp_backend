exports.isAdmin = (req, res, next) => {

    try {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (Number(req.user.role_id) !== 1) {
            return res.status(403).json({
                success: false,
                message: "Admin access only"
            });
        }

        next();

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};