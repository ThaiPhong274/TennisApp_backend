const pool = require("../config/db");


// =====================================
// GET ALL COURTS
// =====================================
exports.getAllCourts = async (req, res) => {

    try {

        const result = await pool.query(`
    SELECT
        c.court_id,
        c.court_name,
        c.description,
        c.image,
        c.is_active,

        c.type_id,
        ct.type_name,
        ct.price_per_hour

    FROM courts c

    INNER JOIN court_types ct
        ON c.type_id = ct.type_id

    ORDER BY c.court_id ASC
`);


        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });


    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};




// =====================================
// GET COURT BY ID
// =====================================
exports.getCourtById = async (req,res)=>{

    try {


        const { id } = req.params;


        const result = await pool.query(
            `
            SELECT

                c.court_id,
                c.court_name,
                c.description,
                c.image,
                c.is_active,

                c.type_id,
                ct.type_name,
                ct.price_per_hour


            FROM courts c

            INNER JOIN court_types ct
                ON c.type_id = ct.type_id


            WHERE
    c.court_id = $1
    AND c.is_active = true

            `,
            [id]
        );



        if(result.rows.length === 0){

            return res.status(404).json({
                success:false,
                message:"Court not found"
            });

        }



        return res.status(200).json({

            success:true,

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
// CREATE COURT
// =====================================
exports.createCourt = async(req,res)=>{


    try {


        const {

            court_name,
            description,
            image,
            is_active,
            type_id

        } = req.body;



        if(
            !court_name ||
            !description ||
            !image ||
            type_id === undefined
        ){

            return res.status(400).json({

                success:false,

                message:"Please fill all fields"

            });

        }



        // Default active = true

        const activeStatus =
            is_active === undefined
            ? true
            : is_active;



        // Check duplicate name

        const checkCourt = await pool.query(
            `
            SELECT court_id
            FROM courts
            WHERE court_name = $1
            `,
            [
                court_name
            ]
        );



        if(checkCourt.rows.length > 0){

            return res.status(400).json({

                success:false,

                message:"Court already exists"

            });

        }




        // Check court type

        const checkType = await pool.query(
            `
            SELECT type_id
            FROM court_types
            WHERE type_id = $1
            `,
            [
                type_id
            ]
        );



        if(checkType.rows.length === 0){

            return res.status(400).json({

                success:false,

                message:"Court Type not found"

            });

        }




        const result = await pool.query(
            `
            INSERT INTO courts
            (
                court_name,
                description,
                image,
                is_active,
                type_id
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )

            RETURNING *

            `,
            [

                court_name,
                description,
                image,
                activeStatus,
                type_id

            ]
        );



        return res.status(201).json({

            success:true,

            message:"Create Court Success",

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
// UPDATE COURT
// =====================================
exports.updateCourt = async(req,res)=>{


    try {


        const { id } = req.params;


        const {

            court_name,
            description,
            image,
            is_active,
            type_id

        } = req.body;




        if(
            !court_name ||
            !description ||
            !image ||
            type_id === undefined
        ){

            return res.status(400).json({

                success:false,

                message:"Please fill all fields"

            });

        }




        const activeStatus =
            is_active === undefined
            ? true
            : is_active;




        // Check court exists

        const checkCourt = await pool.query(
            `
            SELECT
        court_id,
        is_active
    FROM courts
    WHERE court_id = $1
            `,
            [
                id
            ]
        );



        if(checkCourt.rows.length===0){

            return res.status(404).json({

                success:false,

                message:"Court not found"

            });

        }

const court = checkCourt.rows[0];

        // Duplicate name

        const duplicate = await pool.query(
            `
            SELECT court_id
            FROM courts
            WHERE court_name=$1
            AND court_id<>$2
            `,
            [
                court_name,
                id
            ]
        );



        if(duplicate.rows.length>0){

            return res.status(400).json({

                success:false,

                message:"Court name already exists"

            });

        }





        // Check type

        const checkType = await pool.query(
            `
            SELECT type_id
            FROM court_types
            WHERE type_id=$1
            `,
            [
                type_id
            ]
        );



        if(checkType.rows.length===0){

            return res.status(400).json({

                success:false,

                message:"Court Type not found"

            });

        }





        const result = await pool.query(
            `
            UPDATE courts

            SET

                court_name=$1,

                description=$2,

                image=$3,

                is_active=$4,

                type_id=$5


            WHERE court_id=$6


            RETURNING *

            `,
            [

                court_name,

                description,

                image,

                activeStatus,

                type_id,

                id

            ]
        );




        return res.status(200).json({

            success:true,

            message:"Update Court Success",

            data:result.rows[0]

        });



    }catch(err){


        console.log(err);


        return res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

};




// =====================================
// DELETE COURT
// =====================================
exports.deleteCourt = async (req, res) => {

    try {

        const { id } = req.params;

        // ==============================
        // CHECK COURT EXISTS
        // ==============================

        const checkCourt = await pool.query(
            `
            SELECT court_id
            FROM courts
            WHERE court_id = $1
            `,
            [id]
        );

        if (checkCourt.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Court not found"

            });

        }

        // ==============================
        // DELETE COURT
        // ==============================

        await pool.query(
            `
            DELETE FROM courts
            WHERE court_id = $1
            `,
            [id]
        );

        // ==============================
        // RESPONSE
        // ==============================

        return res.status(200).json({

            success: true,

            message: "Delete Court Success"

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
// UPLOAD COURT IMAGE
// =====================================
exports.uploadCourtImage = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please select an image"
            });

        }

        const imagePath =
            "/uploads/courts/" + req.file.filename;

        return res.status(200).json({

            success: true,

            message: "Upload court image successfully",

            data: {
                image: imagePath
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