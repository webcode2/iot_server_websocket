const express = require("express");
const { db } = require("../db/config");
const { iotDevices } = require("../db/schema");
const { eq } = require("drizzle-orm");
const bcrypt = require('bcryptjs');
const { authRegister, authLogin, authReset, authForgot, deviceAuthLogin } = require("../controller/authController");


const router = express.Router();
 
// USER APP AUTH
router.post('/login/', authLogin);
router.post('/register/', authRegister);
router.post("/reset/",authReset);
router.post("/forget/",authForgot);

// IIOT DEVICE AUTH
router.post("/device/login/",deviceAuthLogin)
router.post("/re",()=>{})













module.exports = router;