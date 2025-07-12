import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db/config.js";
import { staff, developer } from "../db/schema.js";

async function seedStaff() {
    try {
        // 1️⃣ Try to find the first developer
        let [existingDeveloper] = await db.select().from(developer).limit(1);

        // 2️⃣ If none exists, create one with default credentials
        if (!existingDeveloper) {
            const defaultPassword = await bcrypt.hash("Dev@12345", 10);
            [existingDeveloper] = await db.insert(developer)
                .values({
                    id: crypto.randomUUID(),
                    name: "Default Developer",
                    email: "developer@example.com",
                    password: defaultPassword,
                })
                .returning();
            console.log(`✅ Created default developer: ${existingDeveloper.name} (${existingDeveloper.email})`);
        } else {
            console.log(`ℹ️ Using existing developer: ${existingDeveloper.name} (${existingDeveloper.email})`);
        }

        // 3️⃣ Seed staff linked to the developer
        const staffMembers = [];

        for (let i = 1; i <= 5; i++) {
            const password = await bcrypt.hash(`Staff@12345${i}`, 10);

            staffMembers.push({
                id: crypto.randomUUID(),
                name: `Staff ${i}`,
                email: `staff${i}@school.edu`,
                password,
                developerId: existingDeveloper.id,
            });
        }

        await db.insert(staff).values(staffMembers);
        console.log(`✅ Seeded ${staffMembers.length} staff members under developer: ${existingDeveloper.name}`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error seeding staff:", err);
        process.exit(1);
    }
}

seedStaff();
