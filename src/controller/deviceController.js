import { sql, eq, gte, lt, and, or } from "drizzle-orm";
import { db } from "../db/config.js";
import { iotDevices, } from "../db/schema.js";
import { startOfDay, endOfDay } from "date-fns";
import jwt from "jsonwebtoken";
import credentials from "../config/credentials.js";
import bcrypt from "bcryptjs";



export const getUserDevices = async ({ developer_id = "" }) => {
    try {

        const devices = await db.query.iotDevices.findMany({
            where: (iot_devices, { eq }) => eq(iotDevices.developerId, developer_id), columns: {
                developerId: true,
                name: true,
                id: true,
                password: false,
                createdAt: false
            }
        })
        return devices
    } catch (err) {
        return []
    }

}


// === CREATE ===
export const createDevice = async (req, res) => {
    try {
        const { developerId, name, password } = req.body;

        if (!developerId || !name || !password) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const [created] = await db.insert(iotDevices).values({
            developerId,
            name,
            hashedPassword,
        }).returning();

        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create IoT device." });
    }
};

// === GET ALL ===
export const getAllDevices = async (req, res) => {
    try {
        const devices = await db.query.iotDevices.findMany({
            where: (iot_devices, { eq }) => eq(iotDevices.developerId, req.user.id), columns: {
                developerId: true,
                name: true,
                id: true,
                password: false,
                createdAt: false
            }
        });

        // Attach a JWT token to each device
        const devicesWithToken = devices.map(device => ({
            ...device,
            jwt_token: jwt.sign(
                {
                    account_name: device.name,
                    account_id: device.id,
                    account_type: "device",
                    developer_id: device.developerId,
                },
                credentials.app_secret,
                { expiresIn: "90d" }
            )
        }));

        res.status(200).json(devicesWithToken);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch devices." });
    }
};

// === GET SINGLE ===
export const getDevice = async (req, res) => {
    try {
        const { appId } = req.params;
        const [device] = await db.select().from(iotDevices).where(eq(iotDevices.id, appId));

        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        res.status(200).json(device);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch device." });
    }
};

// === UPDATE ===
export const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [updated] = await db.update(iotDevices)
            .set(updates)
            .where(eq(iotDevices.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: "Device not found." });
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update device." });
    }
};

// === DELETE ===
export const deleteDevice = async (req, res) => {
    try {
        const { appId } = req.params;

        const [deleted] = await db.delete(iotDevices)
            .where(eq(iotDevices.id, appId), iotDevices.developerId == req.user.id)
            .returning();

        if (!deleted) {
            return res.status(404).json({ message: "Device not found." });
        }

        res.status(200).json({ message: "Device deleted successfully.", deleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete device." });
    }
};
