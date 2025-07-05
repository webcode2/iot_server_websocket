import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { attendance, student } from "../db/schema.js";
import { eq, or, sql } from "drizzle-orm";
import { db } from "../db/config.js";


// export to PDF
export const exportAttendanceController = async () => {
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
            console.log(val)
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
    console.log("................................");

    console.log(data.userId)
    const { accessType, time = new Date(), userId } = JSON.parse(data)
    const [currentStudent] = await db.select().from(student).where(or(eq(student.fingerPrintId, userId), eq(student.rfid, userId)))
    console.log(currentStudent)
    console.log("//////////////////////////");

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



// export const getLogsByDate = async ({ appId, startDate, endDate = new Date() }) => {
//     const result = await getPaginatedLogData({ appId: appId, page: 1, perPage: 40, startDate: startDate, endDate: endDate });


// }
