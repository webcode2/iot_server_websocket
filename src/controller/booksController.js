import { desc, eq } from "drizzle-orm";
import { db } from "../db/config.js";
import { book, borrow, developer, staff, student } from "../db/schema.js";

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

        return res.status(200).json({ message: "Book updated", book: updated });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};



// ''''''''''''''''''''''
// 
// ,,,,,,,,,,,,,,,,,,,,


// Borrow a book
export const borrowBook = async (req, res) => {
    try {
        const { bookId, borrowerId } = req.body;

        // Validate input
        if (!bookId || !borrowerId) {
            return res.status(400).json({ error: 'Book ID and Borrower ID are required.' });
        }

        // Check if the book exists
        const [foundBook] = await db.select().from(book).where(eq(book.id, bookId));
        if (!foundBook) {
            return res.status(404).json({ error: 'Book not found.' });
        }

        // Check if the borrower exists
        const [foundBorrower] = await db.select().from(student).where(eq(student.id, borrowerId));
        if (!foundBorrower) {
            return res.status(404).json({ error: 'Borrower not found.' });
        }

        // // Check if the book is already borrowed and not returned
        // const [existingBorrow] = await db.select().from(borrow).where(
        //     eq(borrow.bookId, bookId)
        // ).where(
        //     eq(borrow.returnedOn, null)
        // );

        // if (existingBorrow) {
        //     return res.status(400).json({ error: 'Book is already borrowed and not yet returned.' });
        // }

        // Insert borrow record
        const [newBorrow] = await db.insert(borrow).values({
            bookId,
            borrowerId,
        }).returning();

        return res.status(201).json(newBorrow);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to borrow book.' });
    }
};

// Return a book
export const returnBook = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Borrow ID is required in request body.' });
        }

        // Find the borrow record
        const [foundBorrow] = await db.select().from(borrow).where(eq(borrow.id, id));
        if (!foundBorrow) {
            return res.status(404).json({ error: 'Borrow record not found.' });
        }

        if (foundBorrow.returnedOn) {
            return res.status(400).json({ error: 'Book has already been returned.' });
        }

        // Update returnedOn
        const [updated] = await db.update(borrow)
            .set({ returnedOn: new Date() })
            .where(eq(borrow.id, id))
            .returning();

        return res.status(200).json({ message: 'Book returned successfully.', updated });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to return book.' });
    }
};


// List all borrows
export const listBorrows = async (req, res) => {
    try {
        const borrows = await db
            .select({
                id: borrow.id,
                bookId: borrow.bookId,
                borrowerId: borrow.borrowerId,
                borrowedOn: borrow.borrowedOn,
                returnedOn: borrow.returnedOn,
                studentName: student.firstName,  // or student.name if that’s your field
                studentMatric: student.matricNo
            })
            .from(borrow)
            .leftJoin(student, eq(borrow.borrowerId, student.id));


        res.status(200).json(borrows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch borrows." });
    }
};







export const getStudentBorrows = async (accessId) => {
    try {

        if (!accessId) {
            return { error: 'Student access ID is required.' };
        }

        // Check if student exists
        const [foundStudent] = await db.select().from(student).where(eq(student.fingerPrintId, accessId));
        if (!foundStudent) {
            return { error: 'Student not found.' };
        }

        // Fetch borrows + book info
        const studentBorrows = await db
            .select({
                borrowId: borrow.id,
                bookId: borrow.bookId,
                borrowedOn: borrow.borrowedOn,
                returnedOn: borrow.returnedOn,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookYear: book.year,
            })
            .from(borrow)
            .innerJoin(book, eq(borrow.bookId, book.id))
            .where(eq(borrow.borrowerId, foundStudent.id));

        return {
            student: {
                id: foundStudent.id,
                firstName: foundStudent.firstName,
                lastName: foundStudent.lastName,
                matriNo: foundStudent.matriNo,
                email: foundStudent.email,
            },
            borrows: studentBorrows,
        }
    } catch (err) {
        console.error(err);
        return { error: 'Failed to fetch student borrows.' }
    }
};