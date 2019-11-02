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

//
// Create user
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

//
// Login user
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

//
// Sync with Partner
app.post('/sync', async (req, res) => {

  const { id, partnername, partnercode } = req.body;
  let partnerId = "";
  let partnerInfo = "";

  const checkPartner = {
    text: `SELECT * FROM users WHERE username = $1 AND usercode = $2`,
    values: [partnername, partnercode]
  }
  const syncUsers = (idToFind, idToSync) => {
    return {
      text: `UPDATE users SET partnerid = $1 WHERE id = $2`,
      values: [idToSync, idToFind]
    }
  }

  // Check partner credentials exist
  try {
    const data = await db.query(checkPartner);
    partnerInfo = data.rows[0];
    partnerId = data.rows.length > 0 ? data.rows[0].id : false;
  }
  catch(err) {
    console.log("ERROR 1 /sync: ", err);
  }
  // If partner credentials exist, sync user and partner
  if (partnerId) {
    try {
      const syncPartnerToUser = db.query(syncUsers(id, partnerId));
      const syncUserToPartner = db.query(syncUsers(partnerId, id));
      res.json({"success": true, "partnerInfo": partnerInfo});
    }
    catch(err) {
      console.log("ERROR 2 /sync: ", err);
    }
  }
  else {
      console.log("Partner Not Found");
      res.json({"success": false})
  }
})

//
// TODO: Get bedtime data
app.post('/data', async (req, res) => {
  const { userid, partnerid } = req.body;

  // confirm partner is synced
  const getPartnerInfo = {
      text: `SELECT * FROM users WHERE partnerid = $1`,
      values: [userid]
  }
  const getRecords = (id) => {
    return {
      text: `SELECT * FROM records WHERE userid = $1`,
      values: [id]
    }
  }

  const partner = await db.query(getPartnerInfo);
  if (partner.rows.length > 0) {
      try {
          const userData = await db.query(getRecords(userid));
          const partnerData = await db.query(getRecords(partnerid));
          console.log(`userdata: ${JSON.stringify(userData.rows)}, partnerdata: ${JSON.stringify(partnerData.rows)}`);
          res.json({"userdata": userData.rows, "partnerdata": partnerData.rows});
      }
      catch(err) {
          console.log("ERROR /data: ", err);
          res.json({"success": false});
      }
  }
  else {
      console.log("Not synced to partner");
      res.json({"success": false, "message": "Not synced to a partner"});
  }

})

// TODO: POST todays time
app.post('/bedtime', (req, res) => {
    const checkToday = {
      text: `SELECT * FROM users WHERE username = $1 AND usercode = $2`,
      values: [username, usercode]
    }
    const addBedTime = {
      text: `INSERT INTO records (userid, date, bedtime, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      values: [username, usercode, usercolor]
    }
    const updateBedTime = {
        text: `UPDATE users SET partnerid = $1 WHERE id = $2`,
        values: [idToSync, idToFind]
    }
  res.send("Bedtime");
})

app.listen(3001);
