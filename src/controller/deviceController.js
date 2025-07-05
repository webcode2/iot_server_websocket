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

// async function getPaginatedLogData({ appId = "", page = 1, perPage = 40, startDate = undefined, endDate = undefined }) {
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

        devices = await db.query.iotDevices.findMany({
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
        console.log(err)
        return []
    }

}
