const { sql, eq, gte, lt, and } = require("drizzle-orm");
const { db } = require("../db/config");
const { iotData } = require("../db/schema");
const { startOfDay, endOfDay } = require('date-fns');

// const { eq } = require("drizzle-orm")




// Helper function to get today's date range
function getTodayRange({ start = new Date(), end = new Date() }) {

    return {
        start: startOfDay(start),
        end: endOfDay(end)
    };
}

async function getPaginatedLogData({ appId = "", page = 1, perPage = 40, startDate = undefined, endDate = undefined }) {
    let { start, end } = getTodayRange({ end: new Date(), start: new Date() });
    if (startDate && endDate) {
        // const { start, end } = getTodayRange({end: new Date(),start: new Date()});
        start = getTodayRange({ start: startDate, end: endDate }).start
        end = getTodayRange({ start: startDate, end: endDate }).end
    } else if (startDate) {
        start = getTodayRange({ start: startDate }).start
    }else if (endDate) {
        end = getTodayRange({ end: endDate }).end
    }

    // const { start, end } = getTodayRange({end: new Date(),start: new Date()});

    const [countResult, data] = await Promise.all([
        // Count query
        db.select({ count: sql`count(*)`.mapWith(Number) })
            .from(iotData)
            .where(and(
                eq(iotData.appId, appId),
                gte(iotData.createdAt, start),
                lt(iotData.createdAt, end)
            )
            ),
        // Data query
        db.query.iotData.findMany({
            where: and(
                eq(iotData.appId, appId),
                gte(iotData.createdAt, start),
                lt(iotData.createdAt, end)
            ),
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: (iotData, { desc }) => [desc(iotData.createdAt)]
        })
    ]);
    return {
        total: countResult[0].count,
        page,
        perPage,
        data
    };
}



async function addNewLog({appId, data}) {
    try {
        await db.insert(iotData).values({ appId: appId, logData: data }).returning()
        return true;
    } catch (err) {
        return false;
    }
}
async function getAllLogs(appId) {
    try {
        const data = await db.query.iotData.findMany({ where: (iotData, { eq }) => eq(iotData.appId, appId) })
        return data;
    } catch (err) {
        return false;
    }
}
async function getTodayLogs({ appId = "", socket = false }) {


    if (!appId) { return false; }
    const result = await getPaginatedLogData({ appId: appId, page: 1, perPage: 40 });
    return result;
}


async function getLogsByDate({ appId, startDate, endDate = new Date() }) {
    const result = await getPaginatedLogData({ appId: appId, page: 1, perPage: 40, startDate: startDate, endDate: endDate });


}

module.exports = {
    addNewLog
    , getTodayLogs,
    getAllLogs
}