// src/seed.ts
const { db } = require('../db/config'); // Your initialized Drizzle instance
const { iotDevices, iotData, developer } = require('../db/schema');
const { sql } = require('drizzle-orm');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Helper function to generate random IoT data
function generateRandomIotData(deviceId) {
  return {
    temperature: faker.number.float({ min: 15, max: 35, precision: 0.1 }),
    humidity: faker.number.float({ min: 30, max: 90, precision: 0.1 }),
    pressure: faker.number.float({ min: 900, max: 1100, precision: 0.1 }),
    deviceStatus: faker.helpers.arrayElement(['online', 'offline', 'error']),
    timestamp: faker.date.recent({ days: 7 }).toISOString()
  };
}

async function seedDatabase() {

  try {

    // Check if the database connection is established

    console.log('Starting database seeding...');


    // check if there are seed data
    const hasSeedData = await db.execute(sql`SELECT * FROM ${iotData} LIMIT 1`);
    if (hasSeedData.length > 0) {
      console.log('Seed data already exists. Skipping seeding process.');
      return;
    } else {






      // Clear existing data (optional)
      await db.execute(sql`TRUNCATE TABLE ${iotData} CASCADE`);
      // await db.execute(sql`TRUNCATE TABLE ${iotDevices} CASCADE`);
      const developers = await db.insert(developer).values([
        { name: "Princess", email: "princ@me.us", password: bcrypt.hashSync("password123", bcrypt.genSaltSync(10)) },
        { name: "John", email: "john@me.us", password: bcrypt.hashSync("password123", bcrypt.genSaltSync(10)) },
        { name: "Yu", email: "Yu@me.us", password: bcrypt.hashSync("password123", bcrypt.genSaltSync(10)) },
      ]).returning();

      // Seed IoT Devices
      const devices = await db.insert(iotDevices).values([
        {
          name: 'Smart Thermostat',
          password: bcrypt.hashSync('password123', bcrypt.genSaltSync(10)),
          developerId: faker.helpers.arrayElement(developers.map(dev => dev.id)),
        },
        {
          name: 'Security Camera',
          password: bcrypt.hashSync('password123', bcrypt.genSaltSync(10)),
          developerId: faker.helpers.arrayElement(developers.map(dev => dev.id)),
        },
        {
          name: 'Air Quality Monitor',
          password: bcrypt.hashSync('password123', bcrypt.genSaltSync(10)),
          developerId: faker.helpers.arrayElement(developers.map(dev => dev.id)),
        }
      ]).returning();

      console.log(`Inserted ${devices.length} IoT devices`);

      // Seed IoT Data for each device
      for (const device of devices) {
        const dataEntries = Array.from({ length: 50 }, () => ({
          appId: device.id,
          logData: generateRandomIotData(device.id)
        }));

        const insertedData = await db.insert(iotData)
          .values(dataEntries)
          .returning();

        console.log(`Inserted ${insertedData.length} data entries for device ${device.name}`);
      }

      console.log('Database seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}



seedDatabase();
