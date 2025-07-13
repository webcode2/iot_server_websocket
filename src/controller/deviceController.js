import { sql, eq, gte, lt, and, or } from "drizzle-orm";
import { db } from "../db/config.js";
import { iotDevices, attendance, student } from "../db/schema.js";
import { startOfDay, endOfDay } from "date-fns";


// Helper function to get today's date range
function getTodayRange({ start = new Date(), end = new Date() }) {

    return {
        start: startOfDay(start),
        end: endOfDay(end)
    };
}

// async function getPaginatedLogData({ appappId = "", page = 1, perPage = 40, startDate = undefined, endDate = undefined }) {
//     let { start, end } = getTodayRange({ end: new Date(), start: new Date() });
//     if (startDate && endDate) {
//         // const { start, end } = getTodayRange({end: new Date(),start: new Date()});
//         start = getTodayRange({ start: startDate, end: endDate }).start
//         end = getTodayRange({ start: startDate, end: endDate }).end
//     } else if (startDate) {
//         start = getTodayRange({ start: startDate }).start
//     } else if (endDate) {
//         end = getTodayRange({ end: endDate }).end
//     }

//     // const { start, end } = getTodayRange({end: new Date(),start: new Date()});

//     const [countResult, data] = await Promise.all([
//         // Count query
//         db.select({ count: sql`count(*)`.mapWith(Number) })
//             .from(iotData)
//             .where(and(
//                 eq(iotData.appId, appId),
//                 gte(iotData.createdAt, start),
//                 lt(iotData.createdAt, end)
//             )
//             ),
//         // Data query
//         db.query.iotData.findMany({
//             where: and(
//                 eq(iotData.appId, appId),
//                 gte(iotData.createdAt, start),
//                 lt(iotData.createdAt, end)
//             ),
//             limit: perPage,
//             offset: (page - 1) * perPage,
//             orderBy: (iotData, { desc }) => [desc(iotData.createdAt)]
//         })
//     ]);
//     return {
//         total: countResult[0].count,
//         page,
//         perPage,
//         data
//     };
// }


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
        })
        res.status(200).json(devices);
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
