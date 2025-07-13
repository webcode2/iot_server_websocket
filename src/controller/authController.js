import bcrypt from "bcryptjs";
import { db } from "../db/config.js";
import { iotDevices, developer, staff } from "../db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import credentials from "../config/credentials.js";




async function generateToken(data=undefined) {
    if (!credentials.app_secret)         throw new Error('SECRET environment variable is not set');
    if (data===undefined) throw new Error("jwt payload isn't attached")
    return jwt.sign({...data}, credentials.app_secret, {
        expiresIn: '30d'
    });
}


export const authLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1️⃣ Try developer first
        const [foundDeveloper] = await db.select().from(developer).where(eq(developer.email, email));

        if (foundDeveloper) {
            const valid = bcrypt.compareSync(password, foundDeveloper.password);
            if (!valid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const jwt_token = await generateToken({
                account_name: foundDeveloper.name,
                account_id: foundDeveloper.id,
                account_type: 'developer'
            });

            const { passwordResetToken: __, password: _, ...safeData } = foundDeveloper;
            return res.status(200).json({ jwt_token, ...safeData });
        }

        // 2️⃣ If no developer found, check staff
        const [foundStaff] = await db.select().from(staff).where(eq(staff.email, email));

        if (foundStaff) {
            const valid = bcrypt.compareSync(password, foundStaff.password);
            if (!valid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const jwt_token = await generateToken({
                account_name: foundStaff.name,
                account_id: foundStaff.id,
                account_type: 'staff',
                developer_id: foundStaff.developerId, // so you know who owns this staff
            });

            const { password: _, ...safeData } = foundStaff;
            return res.status(200).json({ jwt_token, ...safeData });
        }

        // 3️⃣ If neither found
        return res.status(401).json({ error: 'Invalid email or password' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


export const deviceAuthLogin = async (req, res) => {
    try {
        const data = await db.query.iotDevices.findFirst({ where: (iotDevices, { eq }) => eq(iotDevices.id, req.body.id) })
        if (data) {
            if (bcrypt.compareSync(req.body.password, data.password)) {

                return res.status(200).json({ jwt_token: await generateToken({ account_name: data.name, account_id: data.id, account_type: "device",developer_id:data.developerId }), ...data, password: undefined });
            }
        }
        return res.status(401).json({ error: "Invalid email or password" });

    } catch (err) { res.status(400).json({ error: err.message }); }
}


export const authRegister = async (req, res) => {
    // Hash the password
    if (!req.body?.password) {
        return res.status(400).json({ error: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);


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



export const authReset = async (req, res) => {

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
export const authForgot = async (req, res) => {
    if (!req.body?.email) return res.status(400).json({ error: "Email is required" });
    try {
        let device = await db.query.iotDevices.findFirst({ where: (iotDevices, { eq }) => eq(iotDevices.email, req.body.email) })
        if (device) {
            const token = Math.random().toString(36).substring(2, 7);
            db.update(iotDevices).set({ passwordResetToken: token }).where(eq(iotDevices.id, device.id)).returning()
            // Send email with token
        }
        // Sendd email with token
        res.status(200).json({ message: "Password reset token sent" });
    } catch (err) {
        res.status(400).json({ error: "Oop! something went wrong, please give a moment while we fix it👀" });
    }
}





// tope staff
// add Users{Staff}

// === CREATE ===
export const createStaff = async (req, res) => {
    try {
        const { name, email, password, developerId } = req.body;

        if (!name || !email || !password || !developerId) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newStaff] = await db.insert(staff).values({
            name,
            email,
            password: hashedPassword,
            developerId
        }).returning();

        res.status(201).json(newStaff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create staff." });
    }
};

// === READ ALL ===
export const getAllStaff = async (req, res) => {
    try {
        const allStaff = await db.select().from(staff);
        res.status(200).json(allStaff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch staff." });
    }
};

// === READ ONE ===
export const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const [foundStaff] = await db.select().from(staff).where(eq(staff.id, id));

        if (!foundStaff) {
            return res.status(404).json({ message: "Staff not found." });
        }

        res.status(200).json(foundStaff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch staff." });
    }
};

// === UPDATE ===
export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        // Fetch target staff record
        const [target] = await db.select().from(staff).where(eq(staff.id, id));
        if (!target) {
            return res.status(404).json({ message: "Staff not found." });
        }

        // Verify permission
        const isOwner = req.user.id === target.id;
        const isDeveloper = req.user.account_type === "developer" && req.user.id === target.developerId;

        if (!isOwner && !isDeveloper) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to update this account." });
        }

        // Prepare updates
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (password) updates.password = await bcrypt.hash(password, 10);

        const [updated] = await db.update(staff)
            .set(updates)
            .where(eq(staff.id, id))
            .returning();

        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update staff." });
    }
};


// === DELETE ===
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch target staff record
        const [target] = await db.select().from(staff).where(eq(staff.id, id));
        if (!target) {
            return res.status(404).json({ message: "Staff not found." });
        }

        // Verify permission
        const isOwner = req.user.id === target.id;
        const isDeveloper = req.user.account_type === "developer" && req.user.id === target.developerId;

        if (!isOwner && !isDeveloper) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to delete this account." });
        }

        const [deleted] = await db.delete(staff)
            .where(eq(staff.id, id))
            .returning();

        res.status(200).json({ message: "Staff deleted.", deleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete staff." });
    }
};
