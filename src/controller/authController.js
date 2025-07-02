const bcrypt = require("bcryptjs")
const { db } = require("../db/config");
const { iotDevices, developer } = require("../db/schema");
const { eq } = require("drizzle-orm")
const jwt = require("jsonwebtoken");
const credentials = require("../utils/credentials");
require('dotenv').config();


async function generateToken(data=undefined) {
    if (!credentials.app_secret)         throw new Error('SECRET environment variable is not set');
    if (data===undefined) throw new Error("jwt payload isn't attached")
    return jwt.sign({...data}, credentials.app_secret, {
        expiresIn: '30d'
    });
}

const authLogin = async (req, res) => {
    try {
        data = await db.query.developer.findFirst({ where: (developer, { eq }) => eq(developer.email, req.body.email) })
        if (data) {
            if (bcrypt.compareSync(req.body.password, data.password)) {

                return res.status(200).json({ jwt_token: await generateToken({ account_name: data.name, account_id: data.id, account_type: "developer" }), ...data, password: undefined });
            }
        }
        return res.status(401).json({ error: "Invalid email or password" });

    } catch (err) { res.status(400).json({ error: err.message }); }
}


const deviceAuthLogin = async (req, res) => {
    try {
        data = await db.query.iotDevices.findFirst({ where: (iotDevices, { eq }) => eq(iotDevices.id, req.body.id) })
        if (data) {
            if (bcrypt.compareSync(req.body.password, data.password)) {

                return res.status(200).json({ jwt_token: await generateToken({ account_name: data.name, account_id: data.id, account_type: "device",developer_id:data.developerId }), ...data, password: undefined });
            }
        }
        return res.status(401).json({ error: "Invalid email or password" });

    } catch (err) { res.status(400).json({ error: err.message }); }
}



const authRegister = async (req, res) => {
    // Hash the password
    if (!req.body?.password) {
        return res.status(400).json({ error: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds = bcrypt.genSaltSync(10));


    try {
        // Insert developer
        const [dev] = await db.insert(developer)
            .values({ name: req.body.name, email: req.body.email, password: hashedPassword })
            .returning();

        // Insert device
        const [device] = await db.insert(iotDevices).values({
            name: req.body.name,
            password: hashedPassword,
            developerId: dev.id
        })
            .returning();

        // Create clean response objects
        const cleanDev = {
            id: dev.id,
            name: dev.name,
            email: dev.email,
            createdAt: dev.createdAt
            // Include other non-sensitive fields
        };

        const cleanDevice = {
            id: device.id,
            name: device.name,
            createdAt: device.createdAt
            // Include other non-sensitive fields
        };

        res.status(201).json({
            ...cleanDev,
            jwt_token: await generateToken({
                account_name: dev.name,
                account_id: dev.id,account_type:"developer"
                
            }),
            device: cleanDevice
        });
    } catch (err) {
        res.status(400).json({
            error: err.message,
            // For debugging, you might want to include a simplified error
            details: process.env.NODE_ENV === 'development' ? {
                stack: err.stack
            } : undefined
        });
    }
}



const authReset = async (req, res) => {

    // Hash the password
    if (!req.body?.token) return res.status(400).json({ error: "Token not valid" });


    if (!req.body?.password) return res.status(400).json({ error: "New password is required" });
    try {
        let device = await db.query.iotDevices.findFirst({
            where: (iotDevices, { eq, and }) => and(
                eq(iotDevices.passwordResetToken, req.body.token),
                eq(iotDevices.email, req.body.email),
            )
        })
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds = bcrypt.genSaltSync(10));
        if (device) {
            db.update(iotDevices).set({ password: hashedPassword, passwordResetToken: "" }).where(eq(iotDevices.id, device.id)).returning()
        }
        res.status(200).json({ message: "Password reset successfully" });
    } catch (e) {
        res.status(400).json({ error: "bad request" })
    }

}
const authForgot = async (req, res) => {
    if (!req.body?.email) return res.status(400).json({ error: "Email is required" });
    try {
        let device = await db.query.iotDevices.findFirst({ where: (iotDevices, { eq }) => eq(iotDevices.email, req.body.email) })
        if (device) {
            const token = Math.random().toString(36).substring(2, 7);
            db.update(iotDevices).set({ passwordResetToken: token }).where(eq(iotDevices.id, device.id)).returning()
            // Send email with token
            console.log(token)
        }
        // Sendd email with token
        res.status(200).json({ message: "Password reset token sent" });
    } catch (err) {
        res.status(400).json({ error: "Oop! something went wrong, please give a moment while we fix it👀" });
    }
}


module.exports = { authRegister, authLogin, authReset, authForgot, deviceAuthLogin }