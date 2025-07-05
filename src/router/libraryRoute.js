import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from "../db/config.js";
import { attendance, student } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { exportAttendanceController } from "../controller/libraryController.js";

export const exportAttendance = async (req, res) => {
    const pdfBytes = await exportAttendanceController()
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.pdf');
    res.send(Buffer.from(pdfBytes));
}
