const express = require('express')
const pool = require('../config')
const path = require("path")
const multer = require('multer')
const { json } = require("express");
const fs = require("fs");
let alert = require('alert');
const Joi = require("joi");
const router = express.Router()


const regisValidator = async (value, helpers) => {
    const [rows, _] = await pool.query(
      "SELECT * FROM Car WHERE car_regis = ?",
      [value]
    );
    if (rows.length > 0) {
      alert("This car registration is already taken");
      return res.status(400).send(err);
    } else {
      return value;
    }
  };

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./static/uploads");
    },
    filename: function (req, file, callback) {
        callback(
            null,
            file.originalname.split(path.extname(file.originalname))[0] +
            "-" +
            Date.now() +
            path.extname(file.originalname)
        );
    },
});
const upload = multer({ storage: storage });



router.post('/detail/:carid', async function (req, res, next) {
    try {
        const [detailcar, field] = await pool.query(
            'SELECT * FROM Car AS c JOIN Seller AS s ON(c.seller_id = s.user_id) JOIN Users AS u ON(u.user_id = s.user_id) WHERE car_id = ?', [
            req.params.carid
        ]
        )
        const [carimg, field1] = await pool.query(
            'SELECT * FROM Car_images WHERE car_id = ?', [
            req.params.carid
        ]
        )
        res.json({
            detailcar: detailcar[0],
            carimg: carimg
        })
    } catch (error) {
        res.json(error)
    }
})
router.post('/getcar', async function (req, res, next) {
    try {
        const [cars, field] = await pool.query(
            "SELECT * FROM Car Join Car_images USING(car_id) LEFT OUTER JOIN Sales_data USING(car_id) WHERE main = 1"
        )
        // cars.forEach(car => {
        //     var thai = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB' }).format(car.car_price);
        //     car.push({bath : thai})
        // });
        return res.json(cars);
    } catch (err) {
        return res.status(500).json(err)
    }
})

const add_updateSchema = Joi.object({
    car_model: Joi.string().required(),
    car_year: Joi.number().integer().required(),
    car_color: Joi.string().required(),
    car_desc: Joi.string().required(),
    car_price: Joi.string().required(),
    car_regis: Joi.string().required().external(regisValidator),
    car_distance: Joi.number().integer().required(),
    car_engine: Joi.string().required(),
    car_gear: Joi.string().required(),
    car_yearbought: Joi.number().integer().required(),
    car_owner: Joi.string().required(),
    car_num_of_gear: Joi.number().integer().required(),
    car_type: Joi.string().required(),
    car_brand: Joi.string().required(),
    car_drive_type: Joi.string().required(),
    car_act: Joi.string().required(),
    car_num_of_door: Joi.number().integer().required()
});

router.post(
    "/addcar/:id",
    upload.array("carImage", 6),
    async function (req, res, next) {
        try {
            await add_updateSchema.validateAsync(req.body, { abortEarly: false });
        } catch (err) {
            return res.status(400).send(err);
        }
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        // console.log(req.files);
        try {
            const file = req.files;
            let pathArray = [];
            let car_model = req.body.car_model;
            let car_year = req.body.car_year;
            let car_color = req.body.car_color;
            let car_desc = req.body.car_desc;
            let car_price = req.body.car_price;
            let car_regis = req.body.car_regis;
            let car_distance = req.body.car_distance;
            let car_engine = req.body.car_engine;
            let car_gear = req.body.car_gear;
            let car_yearbought = req.body.car_yearbought;
            let car_owner = req.body.car_owner;
            let car_num_of_gear = req.body.car_num_of_gear;
            let car_type = req.body.car_type;
            let car_brand = req.body.car_brand;
            let car_drive_type = req.body.car_drive_type;
            let car_act = req.body.car_act;
            let car_num_of_door = req.body.car_num_of_door;
            // console.log(
            //     car_year,
            //     car_color,
            //     car_desc,
            //     car_price,
            //     car_regis,
            //     car_distance,
            //     car_engine,
            //     car_gear,
            //     car_yearbought,
            //     car_owner,
            //     car_num_of_gear,
            //     car_brand,
            //     car_drive_type,
            //     car_act,
            //     car_num_of_door
            // );
            const [car, field1] = await conn.query(
                "INSERT INTO Car(seller_id, car_model, car_modelyear, car_color, car_desc, car_price, car_regis, car_distance, car_engine, car_gear, car_yearbought, car_owner, car_num_of_gear, car_type, car_brand, car_drive_type, car_act, car_num_of_door) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    req.params.id,
                    car_model,
                    car_year,
                    car_color,
                    car_desc,
                    car_price,
                    car_regis,
                    car_distance,
                    car_engine,
                    car_gear,
                    car_yearbought,
                    car_owner,
                    car_num_of_gear,
                    car_type,
                    car_brand,
                    car_drive_type,
                    car_act,
                    car_num_of_door,
                ]
            );
            // console.log(car.insertId);
            let checkmain = true;
            file.forEach((file, index) => {
                let path = [file.path.substring(6), car.insertId, checkmain];
                pathArray.push(path);
                if (checkmain == true) {
                    checkmain = false;
                }
            });
            // console.log(pathArray);
            const [img, field2] = await conn.query(
                "INSERT INTO Car_images(car_img, car_id, main) VALUES ?;",
                [pathArray]
            );
            await conn.commit();
            // console.log(img.insertId);
            return res.json("success");
        } catch (err) {
            await conn.rollback();
            next(err);
        }
    }
);








router.post(
    "/updatecar/:id",
    upload.array("carImage", 6),
    async function (req, res, next) {
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
            const file = req.files;
            let pathArray = [];
            let deleteimg = []
            let car_model = req.body.car_model;
            let car_year = req.body.car_year;
            let car_color = req.body.car_color;
            let car_desc = req.body.car_desc;
            let car_price = req.body.car_price;
            let car_regis = req.body.car_regis;
            let car_distance = req.body.car_distance;
            let car_engine = req.body.car_engine;
            let car_gear = req.body.car_gear;
            let car_yearbought = req.body.car_yearbought;
            let car_owner = req.body.car_owner;
            let car_num_of_gear = req.body.car_num_of_gear;
            let car_type = req.body.car_type;
            let car_brand = req.body.car_brand;
            let car_drive_type = req.body.car_drive_type;
            let car_act = req.body.car_act;
            let car_num_of_door = req.body.car_num_of_door;
            // console.log(
            //     car_year,
            //     car_color,
            //     car_desc,
            //     car_price,
            //     car_regis,
            //     car_distance,
            //     car_engine,
            //     car_gear,
            //     car_yearbought,
            //     car_owner,
            //     car_num_of_gear,
            //     car_brand,
            //     car_drive_type,
            //     car_act,
            //     car_num_of_door
            // );

            try {
                await add_updateSchema.validateAsync(req.body, { abortEarly: false });
            } catch (err) {
                alert('Incomplete information.')
                return res.status(400).send(err);
            }

            const [car, field1] = await conn.query(
                "UPDATE Car SET car_model = ?, car_modelyear = ?, car_color = ?, car_desc = ?, car_price = ?, car_regis = ?, car_distance = ?, car_engine = ?, car_gear = ?, car_yearbought = ?, car_owner = ?, car_num_of_gear = ?, car_type = ?, car_brand = ?, car_drive_type = ?, car_act = ?, car_num_of_door = ? WHERE car_id = ?",
                [
                    car_model,
                    car_year,
                    car_color,
                    car_desc,
                    car_price,
                    car_regis,
                    car_distance,
                    car_engine,
                    car_gear,
                    car_yearbought,
                    car_owner,
                    car_num_of_gear,
                    car_type,
                    car_brand,
                    car_drive_type,
                    car_act,
                    car_num_of_door,
                    req.params.id,
                ]
            );
            const [
                images,
                imageFields,
            ] = await conn.query(
                "SELECT car_img FROM Car_images WHERE car_id = ?",
                [req.params.id]
            );
            //   images.forEach(img => {
            //     //   console.log(img.car_img == req.body.carImage[0].substring(21))
            //       req.body.carImage.filter(val =>{
            //           if(val.substring(21) != img.car_img){
            //               deleteimg.push(img.car_img)
            //           }
            //         })
            //     //   if(req.body.carImage[0].substring(21).indexOf(img) < 0){
            //     //     deleteimg.push(img)
            //     //   }
            //   });
            //   console.log(deleteimg)
            //   // // Delete File from path
            const appDir = path.dirname(require.main.filename); // Get app root directory
            // console.log(appDir)
            images.forEach(img => {
                const p = path.join(appDir, 'static', img.car_img);
                fs.unlinkSync(p);
            });

            const [
                delimages,
                _,
            ] = await conn.query(
                "DELETE FROM Car_images WHERE car_id = ?",
                [req.params.id]
            );

            let checkmain = true;
            file.forEach((file, index) => {
                let path = [file.path.substring(6), req.params.id, checkmain];
                pathArray.push(path);
                if (checkmain == true) {
                    checkmain = false
                }
            });
            // console.log(pathArray)
            const [img, field2] = await conn.query(
                'INSERT INTO Car_images(car_img, car_id, main) VALUES ?;', [
                pathArray
            ]
            )
            await conn.commit();
            return res.json("success");
        } catch (err) {
            await conn.rollback();
            next(err);
        }
    }
);

router.get('/compare/:car1/:car2', async function (req, res, next) {
    let firstcar = req.params.car1;
    let secondcar = req.params.car2;
    try {
        const [detailfirstcar, field] = await pool.query(
            'SELECT * FROM Car WHERE car_id = ?', [
            firstcar
        ]
        )
        const [firstcar_img, _] = await pool.query(
            'SELECT * FROM Car_images WHERE car_id = ?', [
                firstcar] 
        )
        const [firstcar_img2, __] = await pool.query(
            'SELECT * FROM Car_images WHERE car_id = ?', [
                secondcar] 
        )
        const [detailsecondcar, field1] = await pool.query(
            'SELECT * FROM Car WHERE car_id = ?', [
            secondcar
        ]
        )
        return res.json({
            firstcar: detailfirstcar[0],
            secondcar: detailsecondcar[0],
            imgcar1: firstcar_img,
            imgcar2: firstcar_img2
        })
    } catch (error) {
        res.json(error)
    }
})



module.exports = router
