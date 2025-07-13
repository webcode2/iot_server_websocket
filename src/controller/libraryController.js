import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { attendance, student } from "../db/schema.js";
import { count, eq, or, sql } from "drizzle-orm";
import { db } from "../db/config.js";


// export to PDF
const exportAttendanceController = async () => {
    const records = await db
        .select({
            matricNo: student.matriNo,
            firstName: student.firstName,
            lastName: student.lastNname,
            id: attendance.id,
            time: attendance.time,
            accessType: attendance.methodUsed,
        })
        .from(attendance)
        .innerJoin(student, eq(attendance.studentId, student.id))
        .where(
            sql`DATE(${attendance.time} AT TIME ZONE 'UTC') = CURRENT_DATE`
        );

    // Step 2: Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    let y = 790;

    // Title
    page.drawText("Today's Attendance Report", {
        x: 50,
        y,
        size: 16,
        font,
        color: rgb(0.1, 0.1, 0.6),
    });

    y -= 30;

    // Headers
    const headers = ['Matric No', 'Name', 'Time', 'Method'];
    const colWidths = [120, 200, 150, 80];

    headers.forEach((header, i) => {
        page.drawText(header, {
            x: 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0.8),
        });
    });

    y -= 20;

    // Data rows
    for (const rec of records) {
        if (y < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 790;
        }

        const name = `${rec.lastName ? rec.lastName : ""} ${rec.firstName ? rec.firstName : ""} `;
        const time = new Date(rec.time).toLocaleTimeString('en-GB');

        const values = [rec.matricNo, name, time, rec.accessType];

        values.forEach((val, i) => {
            page.drawText(val !== null ? val.toString() : "_", {
                x: 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
                y,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });
        });

        y -= 18;
    }

    // Step 3: Send PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes

}

export const addNewAttendance = async (data) => {

    let parsed = {};

    if (typeof data === 'string') {
        parsed = JSON.parse(data);
    } else if (Buffer.isBuffer(data)) {
        parsed = JSON.parse(data.toString());
    } else if (typeof data === 'object' && data !== null) {
        parsed = data;
    } else {
        throw new Error('Unsupported data type for parsing');
    }

    const {
        accessType,
        time = new Date(),
        id: userId
    } = parsed.message;
    const [currentStudent] = await db.select().from(student).where(or(eq(student.fingerPrintId, userId), eq(student.rfid, userId)))
  

    if (!currentStudent) { return null }

    const [atten] = await db.insert(attendance).values({ time: time, methodUsed: accessType, studentId: currentStudent.id }).returning()
    return {
        id: atten.id,
        matricNo: currentStudent.matriNo,
        lastName: currentStudent.lastNname,
        time: atten.time,
        accessType: atten.methodUsed,

    }

}
export const getAttendance = async ({ page = 1, pageSize = 50 } = {}) => {
    const offset = (page - 1) * pageSize;
    const [countResult] = await db.select({ total: count() }).from(attendance)

    const totalRaw = countResult?.[0]?.total ?? countResult?.[0]?.count ?? 0;
    const total = parseInt(totalRaw, 10) || 0;

    const records = await db
        .select()
        .from(attendance)
        .leftJoin(student, eq(attendance.studentId, student.id))
        .orderBy(attendance.time, "desc")
        .limit(pageSize)
        .offset(offset);

    const data = records.map((record) => ({
        id: record.attendance.id,
        time: record.attendance.time,
        accessType: record.attendance.methodUsed,
        student: {
            id: record.student?.id,
            matricNo: record.student?.matriNo,
            lastName: record.student?.lastName,
            firstName: record.student?.firstName,
        },
    }));

    return {
        data,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
};

export const exportAttendance = async (req, res) => {
    const pdfBytes = await exportAttendanceController()
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.pdf');
    res.send(Buffer.from(pdfBytes));
}


export const getAttendant = async (id) => {
    if (id) {
        const [record] = await db
            .select()
            .from(attendance)
            .where(eq(attendance.id, id))
            .leftJoin(student, eq(attendance.studentId, student.id));

        if (!record) return null;

        return {
            id: record.attendance.id,
            time: record.attendance.time,
            accessType: record.attendance.methodUsed,
            student: {
                id: record.student.id,
                matricNo: record.student.matriNo,
                lastName: record.student.lastNname,
            },
        };
    } else {
        const records = await db
            .select()
            .from(attendance)
            .leftJoin(student, eq(attendance.studentId, student.id));

        return records.map((record) => ({
            id: record.attendance.id,
            time: record.attendance.time,
            accessType: record.attendance.methodUsed,
            student: {
                id: record.student.id,
                matricNo: record.student.matriNo,
                lastName: record.student.lastNname,
            },
        }));
    }
};


export const updateAttendance = async (id, data) => {
    if (!id) throw new Error("Attendance ID required for update.");

    // Extract valid fields
    const { accessType, time, studentId } = data;

    const [updated] = await db
        .update(attendance)
        .set({
            methodUsed: accessType,
            time: time ? new Date(time) : undefined,
            studentId,
        })
        .where(eq(attendance.id, id))
        .returning();

    return updated;
};

export const deleteAttendance = async (id) => {
    if (!id) throw new Error("Attendance ID required for deletion.");

    const deleted = await db
        .delete(attendance)
        .where(eq(attendance.id, id))
        .returning();

    return deleted.length > 0 ? deleted[0] : null;
};
