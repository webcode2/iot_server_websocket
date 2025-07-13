import { eq } from "drizzle-orm"
import { nBMessage } from "../db/schema.js"
import { db } from "../db/config.js"

export const getMessage = async ({ developer_id = "" }) => {
    try {

        const [message] = await db.select().from(nBMessage).where(eq(nBMessage.developerId, developer_id))
        return message
    } catch (err) {
        return null
    }

}
export const setMessage = async ({ developer_id = "", duration = 1, message = "" }) => {
    try {

        const [message] = await db.insert(nBMessage).values({ developer_id: developer_id, message: message, duration: duration }).returning()
        return message
    } catch (err) {
        return null
    }

}
