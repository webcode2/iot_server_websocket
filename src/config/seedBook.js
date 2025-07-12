import crypto from 'crypto';
import { book, staff } from "../db/schema.js";
import { db } from "../db/config.js";

async function seedBooks() {
    try {
        // 1️⃣ Fetch all existing staff
        const staffList = await db.select().from(staff);

        if (staffList.length === 0) {
            console.error("❌ No staff found. Seed staff first before seeding books.");
            process.exit(1);
        }

        const books = [];

        for (let i = 1; i <= 10; i++) {
            // Pick a staff member round-robin style
            const assignedStaff = staffList[i % staffList.length];

            books.push({
                id: crypto.randomUUID(),
                title: `Sample Book Title ${i}`,
                author: `Author ${i}`,
                year: 2000 + i,
                genre: ["Fiction", "Non-Fiction", "Sci-Fi", "Biography"][i % 4],
                description: `This is a sample description for book number ${i}.`,
                liberianId: assignedStaff.id, // ✅ Use real staff ID
            });
        }

        await db.insert(book).values(books);
        console.log(`✅ Seeded ${books.length} books assigned to ${staffList.length} staff successfully.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error seeding books:", err);
        process.exit(1);
    }
}

seedBooks();
