
import express from "express";
import { db } from "../db/config.js";
import { iotDevices } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
    authRegister,
    authLogin,
    authReset,
    authForgot,
    deviceAuthLogin
} from "../controller/authController.js";



const router = express.Router();
 
// USER APP AUTH
router.post('/login/', authLogin);
router.post('/register/', authRegister);
router.post("/reset/",authReset);
router.post("/forget/",authForgot);

// IIOT DEVICE AUTH
router.post("/device/login/",deviceAuthLogin)



export default router
