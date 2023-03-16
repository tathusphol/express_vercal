const express = require("express");
const pool = require("../config");
const path = require("path");
const Joi = require("joi");
const multer = require("multer");
const { json } = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
let alert = require("alert");
const { query } = require("../config");

const passwordValidator = (value, helpers) => {
  if (value.length < 8) {
    alert("Password must contain at least 8 characters");
    return res.status(400).send(err);
  }
  if (!(value.match(/[a-z]/) && value.match(/[A-Z]/) && value.match(/[0-9]/))) {
    alert("Password must be harder");
    return res.status(400).send(err);
  }
  return value;
};
const usernameValidator = async (value, helpers) => {
  const [rows, _] = await pool.query(
    "SELECT login_username FROM Login WHERE login_username = ?",
    [value]
  );
  if (rows.length > 0) {
    alert("This username is already taken");
    return res.status(400).send(err);
  } else {
    return value;
  }
};
const emailValidator = async (value, helpers) => {
  const [rows, _] = await pool.query(
    "SELECT user_email FROM Users WHERE user_email = ?",
    [value]
  );
  if (rows.length > 0) {
    alert("This email is already taken");
    return res.status(400).send(err);
  } else {
    return value;
  }
};
const idcardValidator = async (value, helpers) => {
  const [rows, _] = await pool.query(
    "SELECT user_idcard FROM Users WHERE user_idcard = ?",
    [value]
  );
  if (rows.length > 0) {
    alert("This ID card is already taken");
    return res.status(400).send(err);
  } else {
    return value;
  }
};
const phoneValidator = async (value, helpers) => {
  const [rows, _] = await pool.query(
    "SELECT user_phone FROM Users WHERE user_phone = ?",
    [value]
  );
  if (rows.length > 0) {
    alert("This phone is already taken");
    return res.status(400).send(err);
  } else {
    return value;
  }
};

// const passwordValidator = (value, helpers) => {
//     if (value.length < 8) {
//         throw new Joi.ValidationError('Password must contain at least 8 characters')
//     }
//     if (!(value.match(/[a-z]/) && value.match(/[A-Z]/) && value.match(/[0-9]/))) {
//         throw new Joi.ValidationError('Password must be harder')
//     }
//     return value
// }

const signupSchema = Joi.object({
  username: Joi.string().required().external(usernameValidator),
  idcard: Joi.string().required().external(idcardValidator),
  tel: Joi.string()
    .required()
    .external(phoneValidator)
    .pattern(/0[0-9]{9}/),
  email: Joi.string().required().external(emailValidator),
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  address: Joi.string().required(),
  birth: Joi.string().required(),
  gender: Joi.string().required(),
  password1: Joi.string().required().custom(passwordValidator),
  password2: Joi.string().required(),
});

router.post("/register/account", async function (req, res, next) {
  let username = req.body.username;
  let password1 = req.body.password1;
  let password2 = req.body.password2;
  let firstname = req.body.firstname;

  let lastname = req.body.lastname;
  let idcard = req.body.idcard;
  let tel = req.body.tel;
  let email = req.body.email;
  let address = req.body.address;
  let birth = req.body.birth;
  let gender = req.body.gender;
  let customer = null;
  let cus_vertified = "Not-Vertified";

  let now = new Date();
  let birthDate = new Date(birth);
  let age = now.getFullYear() - birthDate.getFullYear();
  let m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  try {
    await signupSchema.validateAsync(req.body, { abortEarly: false });
  } catch (err) {
    return res.status(400).send(err);
  }

  // console.log(username, password1, password2, firstname, lastname, age, idcard, tel, email, address, birth, gender)
  if (password1 != password2) {
    alert("Password do not match");
  }
  else {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      if (age >= 20) {
        customer = true;
        cus_vertified = "Vertified";
      }
      const user = await conn.query(
        "INSERT INTO Users(user_firstname, user_lastname, user_idcard, user_age, user_phone, user_address, user_email, user_gender, user_birth, customer_type) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          firstname,
          lastname,
          idcard,
          age,
          tel,
          address,
          email,
          gender,
          birth,
          customer,
        ]
      );
      user_id = user[0].insertId;
      const addcus = await conn.query(
        "INSERT INTO Customer(cus_vertified, user_id) VALUES(?, ?)",
        [cus_vertified, user_id]
      );
      const login = await conn.query(
        "INSERT INTO Login(login_username, login_password, user_id) VALUES(?, ?, ?)",
        [username, password1, user_id]
      );
      await conn.commit();
      res.json("success");
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      console.log("finally");
      conn.release();
    }
  }
});
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
router.post("/connected", async function (req, res, next) {
  let username = req.body.username;
  let password = req.body.password;
  let token = "";
  let newtoken = []
  try {
    await loginSchema.validateAsync(req.body, { abortEarly: false });
  } catch (err) {
    return res.json("error");
  }
  const [data, field] = await pool.query(
    "SELECT login_username, login_password, user_id FROM Login WHERE login_username = ?",
    [username]
  );
  if (data[0] == undefined) {
    return res.json("error");
  } else {
    let fklogin = data[0].user_id;
    const [user, field1] = await pool.query(
      "SELECT * FROM Users LEFT OUTER JOIN Seller USING(user_id) WHERE user_id = ?",
      [fklogin]
    );
    const [tokens] = await pool.query(
      "SELECT * FROM tokens WHERE user_id = ?",
      [fklogin]
    );
    if(tokens[0] == undefined){
        let chars =
        "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i <= 100; i++) {
            let randomNumber = Math.floor(Math.random() * chars.length);
            token += chars.substring(randomNumber, randomNumber + 1);
        }
        await pool.query(
            'INSERT INTO tokens(user_id, token_key) VALUES(?, ?)', [
                fklogin, token
            ]
        )
    }
    const [newtoken] = await pool.query(
        "SELECT * FROM tokens WHERE user_id = ?",
        [fklogin]
    )
    let dataname = "";
    let datapassword = "";
    if (data.length != 0) {
      dataname = data[0].login_username;
      datapassword = data[0].login_password;
    }
    if (dataname == username && datapassword == password) {
        return res.json(newtoken[0].token_key);
    } else {
      res.json("error");
    }
  }
});

router.post("/forgot", async function (req, res, next) {
  let email = req.body.email;
  let chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let passwordLength = 5;
  let password = "";
  for (let i = 0; i <= passwordLength; i++) {
    let randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }

  try {
    const [data, field] = await pool.query(
      "SELECT * FROM Users WHERE user_email = ?",
      [email]
    );
    if (!data[0]) {
      res.json("error");
    } else {
      const [login, field1] = await pool.query(
        "SELECT * FROM Login WHERE user_id = ?",
        [data[0].user_id]
      );
      const output = `
            <p>You have a new Passcode</p>
            <h3>Passcode to ChangePassword</h3>
            <ul>
                <li>Username : ${login[0].login_username}</li>
                <li>Passcode : ${password}</li>
            </ul>
            `;
      // let testAccount = await nodemailer.createTestAccount();
      // create reusable transporter object using the default SMTP transport
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "tathusphol17599@gmail.com",
          pass: "tathus885269",
        },
      });

      var mailOptions = {
        from: "tathusphol17599@gmail.com",
        to: `${email}`,
        subject: "Passcode",
        text: "Hello!",
        html: output,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          res.json(password);
        }
      });
    }
  } catch (error) {
    return next(error);
  }
});
const forgotSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});
router.post("/changepassword", async function (req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  try {
    const [data, field] = await pool.query(
      "SELECT user_id FROM Users WHERE user_email = ?",
      [email]
    );
    const [login, field1] = await pool.query(
      "UPDATE Login SET login_password = ? WHERE user_id = ?",
      [password, data[0].user_id]
    );
    res.json(user[0]);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
