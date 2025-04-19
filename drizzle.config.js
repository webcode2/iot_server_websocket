import { defineConfig } from "drizzle-kit";
import credentials from "./src/utils/credentials";
const  {connectionString}=require("./src/db/config")

export default defineConfig({
    dbCredentials: {
        // connectionString: connectionString,  
        url:connectionString,
        password: credentials.dbPassword,
        ssl: {
            rejectUnauthorized: false
        }
    },
  dialect: 'postgresql', // 'mysql' | 'sqlite' | 'turso'
  
  schema: './src/db/schema.js',
  
})  