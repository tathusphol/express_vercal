const express = require("express");
const pool = require("../config");
const path = require("path");
const multer = require("multer");
const { json } = require("express");
const fs = require("fs");
const router = express.Router();


router.post("/vertifiedseller/:id", async function (req, res, next) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [row, field] = await conn.query(
        "UPDATE Seller SET `s_vertified` = ? WHERE user_id = ?",
        ["Vertified", req.params.id]
      );
      const [users, field1] = await conn.query(
        "UPDATE Users SET `seller_type` = 1 WHERE user_id = ?",
        [req.params.id]
      );
      await conn.commit();
      return res.json("success");
    } catch (err) {
      await conn.rollback();
      next(err);
    }
  });
  router.post("/cancelseller/:id", async function (req, res, next) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [row, field] = await pool.query(
        "UPDATE Seller SET `s_vertified` = ? WHERE user_id = ?",
        ["Not-Vertified", req.params.id]
      );
      const [users, field1] = await pool.query(
        "UPDATE Users SET `seller_type` = 0 WHERE user_id = ?",
        [req.params.id]
      );
      await conn.commit();
      return res.json("success");
    } catch (err) {
      await conn.rollback();
      return res.status(500).json(err);
    }
  });
  router.put("/finalsell/:saledataid/:emid", async function (req, res, next) {
    try {
      const [saledata, field] = await pool.query(
        "UPDATE Sales_data SET sal_date = CURRENT_TIMESTAMP, sal_status = 'confirmed', em_id = ? WHERE sal_id = ?",
        [req.params.emid, req.params.saledataid]
      );
      return res.json("success");
    } catch (err) {
      return res.status(500).json(err);
    }
  });
  router.get("/getcarsaledata", async function (req, res, next) {
    try {
      const [saledata] = await pool.query(
        "SELECT *, cus.user_firstname AS cusfirstname, cus.user_lastname AS cuslastname, sell.user_firstname AS sellfirstname, sell.user_lastname AS selllastname FROM Car AS c JOIN Car_images AS ca ON(ca.car_id = c.car_id) JOIN Sales_data AS sd ON(c.car_id = sd.car_id) JOIN Users AS sell ON(sd.seller_id = sell.user_id) JOIN Users AS cus ON(cus.user_id = sd.cus_id) WHERE main = 1 and sd.sal_status IN ('waiting admin', 'confirmed')", 
      );
      // console.log(saledata)
      return res.json(saledata);
    } catch (err) {
      return res.status(500).json(err);
    }
  });

  module.exports = router;