const express = require('express');
const bodyParser = require('body-parser');

// DATABASE CONNECTION
const db = require('./db').dbConnection;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// CREATE TABLE users(
//     id SERIAL PRIMARY KEY,
//     username VARCHAR(30) NOT NULL,
//     usercode VARCHAR(30) NOT NULL,
//     usercolor VARCHAR(30) NOT NULL,
//     partnerid INTEGER
//
// CREATE TABLE records(
//     id SERIAL PRIMARY KEY,
//     userid INTEGER REFERENCES users(id),
//     date DATE NOT NULL,
//     bedtime VARCHAR(10) NOT NULL,
//     message TEXT
// )

// TODO: POST Create user
app.post('/createuser', async (req, res) => {
  const { username, usercode, usercolor } = req.body;
  let uniqueUser = "";

  const checkUsers = {
    text: `SELECT * FROM users WHERE username = $1 AND usercode = $2`,
    values: [username, usercode]
  }
  const addUser = {
    text: `INSERT INTO users(username, usercode, usercolor) VALUES($1, $2, $3) RETURNING *`,
    values: [username, usercode, usercolor]
  }

  try {
    const userCheck = await db.query(checkUsers);
    if (userCheck.rows.length > 0) {
      res.json({success: false})
    }
    else {
      console.log("Unique User");
      uniqueUser = true;
    }
  }
  catch(err) {
    console.log("ERROR 1 /createuser: ", err);
  }

  if (uniqueUser) {
    try {
      const data = await db.query(addUser);
      res.json(data.rows[0]);
    }
    catch(err) {
      console.log("ERROR 2 /createuser: ", err);
    }
  }
})

// TODO: POST Create user
app.post('/loginuser', async (req, res) => {
  const { username, usercode } = req.body;
  const validateUser = {
    text: `SELECT * FROM users where username = $1 AND usercode = $2`,
    values: [username, usercode]
  }
  try {
    const data = await db.query(validateUser);
    if (data.rows.length > 0) {
      res.json(data.rows[0]);
    }
    else {
      res.json({success: false});
    }
  }
  catch(err) {
    console.log("ERROR /loginuser: ", err);
  }
})

// TODO: POST Sync with Partner
app.post('/sync', async (req, res) => {
  const { id, partnername, partnercode } = req.body;
  const partnerId = "";
  const checkPartner = {
    text: `SELECT * FROM users where username = $1 AND usercode = $2`,
    values: [partnername, partnercode]
  }

  try {
    const data = await db.query(checkPartner);
    partnerId = data.rows.length > 1 ? data.rows[0].id : false;
  }
  catch(err) {
    console.log("ERROR /sync: ", err);
  }

  if (partnerId) {
    try {

    }
    catch(err) {

    }
  }
})

// TODO: POST partner info and times
app.post('/data', (req, res) => {
  res.send("Data");
})

// TODO: POST todays time
app.post('/bedtime', (req, res) => {
  res.send("Bedtime");
})

// TODO: POST unsync partners
app.post('/unsync', (req, res) => {
  res.send("Unsync");
})

app.listen(3001);
