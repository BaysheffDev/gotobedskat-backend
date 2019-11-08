// ENVIRONMENT VARIABLES
const dotenv = require('dotenv');
dotenv.config();

// POSTGRES DB CONNECTION
const {Pool, Client} = require('pg');
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT;
// const connectionString = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@localhost:${PORT}/gotobedskat`;
const connectionString: process.env.DATABASE_URL;
const db = new Pool({
	connectionString: connectionString,
	ssl: true,
})

module.exports = {
  dbConnection: db
}
