import { sql } from 'drizzle-orm'; // adjust if using drizzle-kit
import crypto from 'crypto';
import { student } from "../db/schema.js";
import { db } from "../db/config.js";

async function seedStudents() {
    const students = [];

    for (let i = 1; i <= 10; i++) {
        const fourDigit = String(i).padStart(4, '0');
        students.push({
            id: crypto.randomUUID(),
            firstName: `FirstName${i}`,
            lastNname: `LastName${i}`,
            matriNo: `DE.2021/${fourDigit}`,
            email: `student${i}@school.edu`,
            fingerPrintId: `${i}`,
            rfid: `RFID${i}`,
            createdAt: new Date(),
        });
    }

    try {
        await db.insert(student).values(students);
        console.log(`✅ Seeded ${students.length} students successfully.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding students:', err);
        process.exit(1);
    }
}

seedStudents();
