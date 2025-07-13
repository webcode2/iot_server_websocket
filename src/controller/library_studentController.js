import { db } from "../db/config.js";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { attendance, student } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";


export const getStudentByFingerPrintIdStudentController = async ({ fingerPrintId }) => {
    const [found] = await db.select().from(student).where(eq(student.fingerPrintId, fingerPrintId));

    return found ? found : { error: "Student not found." }

}

// === CREATE ===
export const createStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            matricNo,
            email,
            fingerPrintId,
            rfid
        } = req.body;

        // Basic validation
        if (!firstName || !lastName || !matricNo) {
            return res.status(400).json({ message: "Required fields are missing." });
        }

        const [created] = await db
            .insert(student)
            .values({
                firstName,
                lastName,
                matricNo,
                email,
                fingerPrintId,
                rfid
            })
            .returning();

        return res.status(201).json(created);

    } catch (err) {

        // ✅ If Postgres unique violation
        if (err.code === "23505") {
            return res.status(409).json({
                message: "Duplicate entry: this student already exists with a unique field.",
                detail: err.detail // e.g. Key (email)=(test@gmail.com) already exists.
            });
        }

        return res.status(500).json({ message: "Failed to create student.", error: err.message });
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
        const { firstName, lastName, matricNo, email, fingerPrintId, rfid } = req.body;

        const updates = {};
        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (matricNo) updates.matricNo = matricNo;
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
        // ✅ If Postgres unique violation
        if (err.code === "23505") {
            return res.status(409).json({
                message: "Duplicate entry: this student already exists with a unique field.",
                detail: err.detail
            });
        }

        return res.status(500).json({ message: "Failed to create student.", error: err.message });
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
