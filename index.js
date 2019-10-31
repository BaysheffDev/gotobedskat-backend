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

 // Check username and usercode combo is unique
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

  // Create the user if unique
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

  // Check that the user exists, if yes return user info
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
    text: `SELECT * FROM users WHERE username = $1 AND usercode = $2`,
    values: [partnername, partnercode]
  }
  const syncUsers (idToFind, idToSync) => {
    return {
      text: `UPDATE users SET partnerid = $1 WHERE id = $2`,
      values: [idToSync, idToFind]
    }
  }

  // Check partner credentials exist
  try {
    const data = await db.query(checkPartner);
    partnerId = data.rows.length > 1 ? data.rows[0].id : false;
  }
  catch(err) {
    console.log("ERROR 1 /sync: ", err);
  }
  // If partner credentials exist, sync user and partner
  if (partnerId) {
    try {
      const syncPartnerToUser = db.query(syncUsers(id, partnerId));
      const syncUserToPartner = db.query(syncUsers(partnerId, id));
      res.json({success: true});
    }
    catch(err) {
      console.log("ERROR 2 /sync: ", err);
    }
  }
})

// TODO: POST partner info and times
app.post('/data', async (req, res) => {
  const { userid, partnerid } = req.body;

  const getRecords = (id) => {
    return checkPartner = {
      text: `SELECT * FROM records WHERE id = $1`,
      values: [id]
    }
  }

  try {
    const userData = await db.query(getRecords(userid));
    const partnerData = await db.query(getRecords(partnerid));
    res.json({"userdata": userdata.rows, "partnerdata": partnerdata.rows});
  }
  catch(err) {
    console.log("ERROR /data: ", err);
  }
  res.send("Data");
})

// TODO: POST todays time
app.post('/bedtime', (req, res) => {
  res.send("Bedtime");
})

app.listen(3001);
