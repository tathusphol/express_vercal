const express = require("express");
const pool = require("../config");
const path = require("path");
const multer = require("multer");
const { json } = require("express");
const fs = require("fs");
const router = express.Router();

router.post('/cusreqseller/:cusid/:carid', async function (req, res, next) {
    let cus_id = req.params.cusid
    let car_id = req.params.carid
    try {
        const [checksaledata] = await pool.query(
            'SELECT * FROM Sales_data WHERE car_id = ? AND cus_id = ?', [
                car_id, cus_id
            ]
        )
        if(checksaledata.length > 0){
            return res.json('You have been this car')
        }
        const [sellerid, _] = await pool.query(
            'SELECT seller_id FROM Seller AS s JOIN Car AS c ON(s.user_id = c.seller_id) WHERE c.car_id = ?', [
                car_id
            ]
        )
        if(sellerid[0].seller_id == cus_id){
            return res.json('You are owner this car')
        }
        const [saledata, field] = await pool.query(
            'INSERT INTO Sales_data(sal_price, sal_status, cus_id, car_id, seller_id) VALUES(?, ?, ?, ?, ?)', [
                0, 'pending', cus_id, car_id, sellerid[0].seller_id
            ])
        return res.json('success')
    } catch (error) {
        return next(error)
    }
  })
  router.get('/getcuscarseller/:cusid', async function (req, res, next) {
    let cus_id = req.params.cusid
    try {
        const [cus, _] = await pool.query(
            'SELECT * FROM Car AS c JOIN Sales_data AS sd ON(c.car_id = sd.car_id) JOIN Car_images AS ci ON(ci.car_id = c.car_id) JOIN Users AS u ON(u.user_id = sd.seller_id) WHERE cus_id = ? AND main = 1', [
                cus_id
            ]
        )
        return res.json(cus)
    } catch (error) {
        return next(error)
    }
  })

module.exports = router;
