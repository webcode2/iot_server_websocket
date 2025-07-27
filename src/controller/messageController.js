import { eq } from "drizzle-orm";
import { Message, staff } from "../db/schema.js";
import { db } from "../db/config.js";

// Get all messages (optionally filter by developer or device)
export const getAllMessages = async (req, res) => {
    try {
        let developerId = req.user?.account_type === "developer" ? req.user.id : undefined;
        let deviceId = req.user?.account_type === "device" ? req.user.id : undefined;

        if (req.query.developerId) developerId = req.query.developerId;
        if (req.query.deviceId) deviceId = req.query.deviceId;

        // If developer, return as is
        if (req.user.account_type === "developer") {
            let query = db.select().from(Message);
            if (developerId) query = query.where(eq(Message.developerId, developerId));
            if (deviceId) query = query.where(eq(Message.deviceId, deviceId));
            const messages = await query;
            return res.status(200).json(messages);
        }

        // If not developer, join staff info
        // Assuming Message has a staffId field and Staff table has id, name
        let query = db
            .select({
                ...Message,
                staffUserId: Staff.id,
                staffUserName: Staff.name
            })
            .from(Message)
            .leftJoin(Staff, eq(Message.staffId, Staff.id));

        if (developerId) query = query.where(eq(Message.developerId, developerId));
        if (deviceId) query = query.where(eq(Message.deviceId, deviceId));

        const messages = await query;
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch messages." });
    }
};

// Get a single message by ID
export const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const [message] = await db.select().from(Message).where(eq(Message.id, id));
        if (!message) {
            return res.status(404).json({ error: "Message not found." });
        }
        // Only allow access if user owns the message
        if (
            (req.user.account_type === "developer" && message.developerId !== req.user.id) ||
            (req.user.account_type === "device" && message.deviceId !== req.user.id)
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }
        res.status(200).json(message);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch message." });
    }
};

// Create a new message
export const createMessage = async (req, res) => {
    try {
        // Use req.user for developer_id or device_id
        let developer_id = req.user.account_type === "developer" ? req.user.id : req.body.developer_id;
        let device_id = req.user.account_type === "device" ? req.user.id : req.body.device_id;
        const { message, duration } = req.body;

        if (!developer_id || !message) {
            return res.status(400).json({ error: "developer_id and message are required." });
        }
        const [created] = await db.insert(Message).values({
            developerId: developer_id,
            deviceId: device_id,
            message,
            duration: duration || 1
        }).returning();
        if (!created) {
            return res.status(500).json({ error: "Failed to create message." });
        }
        res.status(201).json(created);
    } catch (err) {
        console.error("Error creating message:", err);
        res.status(500).json({ error: "Failed to create message." });
    }
};

// Delete a message by ID
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch message to check ownership
        const [message] = await db.select().from(Message).where(eq(Message.id, id));
        if (!message) {
            return res.status(404).json({ error: "Message not found." });
        }
        // Only allow delete if user owns the message
        if (
            (req.user.account_type === "developer" && message.developerId !== req.user.id) ||
            (req.user.account_type === "device" && message.deviceId !== req.user.id)
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }
        await db.delete(Message).where(eq(Message.id, id));
        res.status(200).json({ message: "Message deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete message." });
    }
};

// Update a message by ID
export const updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, duration } = req.body;

        // Fetch message to check ownership
        const [existing] = await db.select().from(Message).where(eq(Message.id, id));
        if (!existing) {
            return res.status(404).json({ error: "Message not found." });
        }
        // Only allow update if user owns the message
        if (
            (req.user.account_type === "developer" && existing.developerId !== req.user.id) ||
            (req.user.account_type === "device" && existing.deviceId !== req.user.id)
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const [updated] = await db
            .update(Message)
            .set({
                ...(message !== undefined && { message }),
                ...(duration !== undefined && { duration })
            })
            .where(eq(Message.id, id))
            .returning();

        if (!updated) {
            return res.status(500).json({ error: "Failed to update message." });
        }
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update message." });
    }
};

// For internal use (WebSocket, etc.)
export const getMessage = async ({ developer_id = "" }) => {
    try {
        const messages = await db.select().from(Message).where(eq(Message.developerId, developer_id, Message.isActive, true));
        const messageTexts = messages.map((msg) => msg.message);

        return messageTexts;
    } catch (err) {
        return null;
    }
};

export const setMessage = async ({ developer_id = "", duration = 1, message = "" }) => {
    try {
        const [msg] = await db.insert(Message).values({
            developerId: developer_id,
            message,
            duration
        }).returning();
        return msg;
    } catch (err) {
        return null;
    }
};
