import express from "express";
import { getAllMessages, getMessageById, createMessage, deleteMessage, updateMessage } from "../controller/messageController.js";
import { authMiddleware } from "../config/authMiddleware.js";

const router = express.Router();

// Get all messages (optionally for a user or device)
router.get("/", authMiddleware, getAllMessages);

// Get a single message by ID
router.get("/:id", authMiddleware, getMessageById);

// Create a new message
router.post("/", authMiddleware, createMessage);

// Update a message by ID
router.put("/:id", authMiddleware, updateMessage);

// Delete a message by ID
router.delete("/:id", authMiddleware, deleteMessage);

export default router;