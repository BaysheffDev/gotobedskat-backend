// Require database connection
const db = require('./db.js').dbConnection;

const selectAll = {
    text: 'SELECT *',
    values: [],
}

const createUsersTable = {
    text: `
    CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL,
        usercode VARCHAR(30) NOT NULL,
        usercolor VARCHAR(30) NOT NULL,
        partnerid INTEGER
    )`,
    values: [],
}

const createRecordsTable = {
    text: `
    CREATE TABLE records(
        id SERIAL PRIMARY KEY,
        userid INTEGER REFERENCES users(id),
        date VARCHAR(12) NOT NULL,
        bedtime VARCHAR(10) NOT NULL,
        message TEXT
    )`,
    values: [],
}

tableQueries = [
    createUsersTable,
    createRecordsTable
]

async function runQueries(queries) {
    for (let i = 0, len = queries.length; i < len; i++) {
        await db.query(queries[i])
        .then(res => console.log(res))
        .catch(err => console.log("Error: ", err));
    }
}

runQueries(tableQueries);
