import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
import { iotDevices, developer, student, attendance, nBMessage } from "./schema.js";
import credentials from "../utils/credentials.js";

const { Pool } = pkg;




const connectionString = `postgres://${credentials.dbUser}:${credentials.dbPassword}@${credentials.dbHost}:5432/${credentials.dbName}`
// Make sure to install the 'pg' package 

const pool = new Pool({
  connectionString: connectionString,
});
const db = drizzle(pool, {
  schema: {
    // Add all your tables 
    developer,
    iotDevices,
    // Jack's Library
    student,
    attendance,
    // TOPE's Notice Board
    nBMessage

  }
});

export { db, pool, connectionString }