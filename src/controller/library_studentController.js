import { db } from "../db/config.js";


import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { attendance, student } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";







// === CREATE ===
export const createStudent = async (req, res) => {
    try {
        const { firstName, lastNname, matriNo, email, fingerPrintId, rfid } = req.body;

        // Basic validation
        if (!firstName || !lastNname || !matriNo) {
            return res.status(400).json({ message: "Required fields missing." });
        }

        const [created] = await db.insert(student).values({
            firstName,
            lastNname,
            matriNo,
            email,
            fingerPrintId,
            rfid
        }).returning();

        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create student." });
    }
};

// === READ ALL ===
export const getAllStudents = async (req, res) => {
    try {
        const students = await db.select().from(student);
        res.status(200).json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch students." });
    }
};

// === READ ONE ===
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [found] = await db.select().from(student).where(eq(student.id, id));

        if (!found) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json(found);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch student." });
    }
};

// === UPDATE ===
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastNname, matriNo, email, fingerPrintId, rfid } = req.body;

        const updates = {};
        if (firstName) updates.firstName = firstName;
        if (lastNname) updates.lastNname = lastNname;
        if (matriNo) updates.matriNo = matriNo;
        if (email) updates.email = email;
        if (fingerPrintId) updates.fingerPrintId = fingerPrintId;
        if (rfid) updates.rfid = rfid;

        const [updated] = await db.update(student)
            .set(updates)
            .where(eq(student.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update student." });
    }
};

// === DELETE ===
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(student)
            .where(eq(student.id, id))
            .returning();

        if (!deleted) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json({ message: "Student deleted.", deleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete student." });
    }
};





// === GET LAST FINGERPRINT ID ===
export const getLastFingerprintId = async () => {
    try {
        // Assumes fingerPrintId is stored as string; cast to INT for sorting
        const [lastStudent] = await db
            .select()
            .from(student)
            .orderBy(sql`CAST(${student.fingerPrintId} AS INTEGER) DESC`)
            .limit(1);

        if (!lastStudent) {
            return null
        }

        return { lastFingerprintId: lastStudent.fingerPrintId };
    } catch (err) {
        return null
    }
};
