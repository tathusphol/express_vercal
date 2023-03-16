const express = require("express");
const pool = require("../config");
const path = require("path");
const multer = require("multer");
const { json } = require("express");
const fs = require("fs");
const router = express.Router();

router.post("/seller/:id", async function (req, res, next) {
  try {
    const [row, field] = await pool.query(
      "SELECT * FROM Users WHERE user_id = ?",
      [req.params.id]
    );
    return res.json(row);
  } catch (err) {
    return res.status(500).json(err);
  }
});
router.post("/requestseller/:id", async function (req, res, next) {
  try {
    const [row, field] = await pool.query("INSERT INTO Seller VALUES(?, ?)", [
      "Not-Vertified",
      req.params.id,
    ]);
    return res.json("success");
  } catch (err) {
    next(err);
  }
});
router.post("/getseller", async function (req, res, next) {
  try {
    const [row, field] = await pool.query(
      "SELECT * FROM Users JOIN Seller USING(user_id)"
    );
    return res.json(row);
  } catch (err) {
    next(err);
  }
});

router.get("/getcarseller/:id", async function (req, res, next) {
  try {
    const [carseller, field] = await pool.query(
      "SELECT * FROM Car AS c JOIN Seller AS s ON(user_id = seller_id) JOIN Car_images AS ci ON(ci.car_id = c.car_id) WHERE main = 1 AND seller_id = ?",
      [req.params.id]
    );
    return res.json(carseller);
  } catch (err) {
    return next(err);
  }
});
router.put("/cancelcus/:carid/", async function (req, res, next) {
  try {
    const [upcar, field] = await pool.query(
      "UPDATE Sales_data SET sal_status = 'cancel' WHERE car_id = ?",
      [req.params.carid]
    );
    return res.json(upcar);
  } catch (err) {
    return next(err);
  }
});
router.put("/confirmcus/:carid/:price", async function (req, res, next) {
  try {
    const [upcar, field] = await pool.query(
      "UPDATE Sales_data SET sal_price = ?, sal_status = 'waiting admin' WHERE car_id = ?",
      [req.params.price, req.params.carid]
    );
    return res.json(upcar);
  } catch (err) {
    return next(err);
  }
});
router.get("/getcarreqcus/:sellerid", async function (req, res, next) {
  // console.log(req.params.sellerid);
  try {
    const [seller, field] = await pool.query(
      "SELECT * FROM Car AS c JOIN Sales_data AS sd ON(c.car_id = sd.car_id) JOIN Car_images AS ci ON(ci.car_id = c.car_id) JOIN Users AS u ON(u.user_id = sd.cus_id) WHERE sd.seller_id = ? AND main = 1",
      [req.params.sellerid]
    );
    return res.json(seller);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
