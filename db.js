// ENVIRONMENT VARIABLES
const dotenv = require('dotenv');
dotenv.config();

// POSTGRES DB CONNECTION
const {Pool, Client} = require('pg');
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT;
const connectionString = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@localhost:${PORT}/gotobedskat`;
const db = new Pool({
	connectionString: connectionString,
})

module.exports = {
  dbConnection: db
}
