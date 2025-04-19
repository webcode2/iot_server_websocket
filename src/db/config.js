const { drizzle } =require( "drizzle-orm/node-postgres")
const { Pool } =require( "pg");
const { iotDevices, iotData, developer, } = require("./schema");
const credentials = require("../utils/credentials");









const connectionString = `postgres://${credentials.dbUser}:${credentials.dbPassword}@${credentials.dbHost}:5432/${credentials.dbName}` 
// Make sure to install the 'pg' package 

const pool = new Pool({
  connectionString: connectionString,
});
const db = drizzle( pool,{
  schema: {
    iotDevices, // Add all your tables here
    iotData,
    developer
  }});
 
module.exports = {db, pool, connectionString}