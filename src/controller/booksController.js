import { desc, eq } from "drizzle-orm";
import { db } from "../db/config.js";
import { book, developer, staff } from "../db/schema.js";

// ✅ Helper: Confirm if user is staff or developer
async function checkIfStaffOrDeveloper(userId) {
    const [staffRow] = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
    if (staffRow) return { role: "staff", data: staffRow };

    const [devRow] = await db.select().from(developer).where(eq(developer.id, userId)).limit(1);
    if (devRow) return { role: "developer", data: devRow };

    return null;
}

// ✅ Manual validation helper
function validateBookInput(body) {
    const errors = [];

    if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
        errors.push("Title is required and must be a string.");
    }

    if (!body.author || typeof body.author !== "string" || body.author.trim() === "") {
        errors.push("Author is required and must be a string.");
    }

    if (!body.year || typeof body.year !== "number" || !Number.isInteger(body.year)) {
        errors.push("Year is required and must be an integer.");
    }

    if (!body.genre || typeof body.genre !== "string" || body.genre.trim() === "") {
        errors.push("Genre is required and must be a string.");
    }

    if (!body.description || typeof body.description !== "string" || body.description.trim() === "") {
        errors.push("Description is required and must be a string.");
    }

    return errors;
}



// ✅ CREATE Book
export const createBook = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const errors = validateBookInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: "Validation failed", errors });
        }
        const roleCheck = await checkIfStaffOrDeveloper(userId);
        if (!roleCheck) {
            return res.status(403).json({ message: "Forbidden: Not staff or developer" });
        }

        const { title, author, year, genre, description } = req.body;

        const [newBook] = await db
            .insert(book)
            .values({
                title,
                author,
                year,
                genre,
                description,
                liberianId: roleCheck.role === "developer" ? null : userId,
            })
            .returning();

        return res.status(201).json({ message: "Book created", book: newBook });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ DELETE Book
export const deleteBook = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const roleCheck = await checkIfStaffOrDeveloper(userId);
        if (!roleCheck) {
            return res.status(403).json({ message: "Forbidden: Not staff or developer" });
        }

        const bookId = req.params.id;
        if (!bookId) {
            return res.status(400).json({ message: "Book ID is required" });
        }

        const [existing] = await db.select().from(book).where(eq(book.id, bookId)).limit(1);
        if (!existing) {
            return res.status(404).json({ message: "Book not found" });
        }

        // if (existing.liberianId !== userId) {
        //     return res.status(403).json({ message: "Forbidden: You do not own this book" });
        // }

        await db.delete(book).where(eq(book.id, bookId));

        return res.status(200).json({ message: "Book deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// ✅ LIST all books
export const listBooks = async (_req, res) => {
    try {
        const books = await db.select().from(book).orderBy(desc(book.year));
        return res.status(200).json(books);
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ GET single book by ID
export const getBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        if (!bookId) return res.status(400).json({ message: "Book ID is required" });

        const [existing] = await db.select().from(book).where(eq(book.id, bookId)).limit(1);
        if (!existing) return res.status(404).json({ message: "Book not found" });

        console.log(existing)
        return res.status(200).json(existing);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ UPDATE book
export const updateBook = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const roleCheck = await checkIfStaffOrDeveloper(userId);
        if (!roleCheck) return res.status(403).json({ message: "Forbidden: Not staff or developer" });

        const bookId = req.params.id;
        if (!bookId) return res.status(400).json({ message: "Book ID is required" });

        const [existing] = await db.select().from(book).where(eq(book.id, bookId)).limit(1);
        if (!existing) return res.status(404).json({ message: "Book not found" });

        // if (existing.liberianId !== userId) {
        //     return res.status(403).json({ message: "Forbidden: You do not own this book" });
        // }

        // Validate input, but allow partial updates:
        const { title, author, year, genre, description } = req.body;

        const updates = {};
        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) return res.status(400).json({ message: "Title must be a non-empty string." });
            updates.title = title.trim();
        }
        if (author !== undefined) {
            if (typeof author !== "string" || !author.trim()) return res.status(400).json({ message: "Author must be a non-empty string." });
            updates.author = author.trim();
        }
        if (year !== undefined) {
            if (typeof parseInt(year) !== "number" || !Number.isInteger(year)) return res.status(400).json({ message: "Year must be an integer." });
            updates.year = year;
        }
        if (genre !== undefined) {
            if (typeof genre !== "string" || !genre.trim()) return res.status(400).json({ message: "Genre must be a non-empty string." });
            updates.genre = genre.trim();
        }
        if (description !== undefined) {
            if (typeof description !== "string" || !description.trim()) return res.status(400).json({ message: "Description must be a non-empty string." });
            updates.description = description.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update." });
        }

        const [updated] = await db
            .update(book)
            .set(updates)
            .where(eq(book.id, bookId))
            .returning();

        console.log(updated)
        return res.status(200).json({ message: "Book updated", book: updated });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
