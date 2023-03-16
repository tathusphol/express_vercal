const express = require("express");
const pool = require("../config");
const path = require("path");
const multer = require("multer");
const { json } = require("express");
const fs = require("fs");
const Joi = require("joi");
const router = express.Router();
let alert = require("alert");

router.post("/saledata/:id", async function (req, res, next) {
    try {
        const [user, field] = await pool.query(
            "SELECT * FROM Users AS WHERE user_id = ?",
            [req.params.id]
        );
        const [seller, field1] = await pool.query(
            "SELECT * FROM Seller AS WHERE user_id = ?",
            [req.params.id]
        );
        const [customer, field2] = await pool.query(
            "SELECT * FROM Users AS WHERE user_id = ?",
            [req.params.id]
        );
        // console.log(row);
        return res.json(row);
    } catch (err) {
        return res.status(500).json(err);
    }
});

const updateaccountSchema = Joi.object({
    email: Joi.string().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    address: Joi.string().required(),
    tel: Joi.string().required(),
});

router.post("/update/account/:id", async function (req, res, next) {
    let id = req.params.id;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let tel = req.body.tel;
    let email = req.body.email;
    let address = req.body.address;
    try {
        await updateaccountSchema.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
        alert('Please input information');
        return res.status(400).send(err);
    }
    try {
        const [data, field] = await pool.query(
            "UPDATE Users SET user_firstname = ?, user_lastname = ?, user_phone = ?, user_address = ?, user_email = ? WHERE user_id = ?",
            [firstname, lastname, tel, address, email, id]
        );
        const [user, field1] = await pool.query(
            "SELECT * FROM Users WHERE user_id = ?",
            [id]
        );
        res.json(user[0]);
    } catch (error) {
        res.json('error');
    }
});


router.post("/getuser", async function (req, res, next) {
    try {
        const [tokens, field] = await pool.query(
            "SELECT * FROM tokens WHERE token_key = ?",
            [req.body.token]
        );
        const [user, field1] = await pool.query(
            "SELECT * FROM Users WHERE user_id = ?",
            [tokens[0].user_id]
        );
        res.json(user[0]);
    } catch (error) {
        res.json('error');
    }
});

module.exports = router;
