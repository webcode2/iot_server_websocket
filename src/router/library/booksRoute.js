import express from "express";
import { authMiddleware } from "../../config/authMiddleware.js";
import { createBook, deleteBook, getBook, listBooks, updateBook } from "../../controller/booksController.js";

const router = express.Router();

// List all books (public)
router.get("/", listBooks);
// Create book (staff/dev only)
router.post("/", authMiddleware, createBook);

// Get single book (public)
router.get("/:id/", getBook);

// ✅ Update book (staff/dev only)
router.put("/:id/", authMiddleware, updateBook);

// Delete book (staff/dev only)
router.delete("/:id/", authMiddleware, deleteBook);



export default router;
