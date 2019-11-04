const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// DATABASE CONNECTION
const db = require('./db').dbConnection;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());

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
  const validatePartner = (id1, id2) => {
     return {
         text: `SELECT * FROM users where id = $1 AND partnerid = $2`,
         values: [id1, id2]
     }
  }

  // Check that the user exists, if yes return user info
  try {
    const data = await db.query(validateUser);
    if (data.rows.length > 0) {
        if (data.rows[0].partnerid) {
            console.log(data.rows[0].partnerid);
            userid = data.rows[0].id;
            partnerid = data.rows[0].partnerid;
            console.log("HELP");
            const partner = await db.query(validatePartner(userid, partnerid));
            console.log("OKOK: ", partner);
            if (partner.rows.length > 0) {
                res.json({"success": true, "userinfo": data.rows[0], "partnerid": partner.rows.id});
            }
            else {
                res.json({"success": true, "userinfo": data.rows[0], "partnerid": false});
            }
        }
        else {
            // if havent previously added partner credentials
        }
    }
    else {
        res.json({"success": false});
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
// Get bedtime data
app.post('/data', async (req, res) => {
  const { userid, partnerid } = req.body;

  // confirm partner is synced
  const getUserInfo = (id) => {
    return {
      text: `SELECT * FROM users WHERE partnerid = $1`,
      values: [id]
    }
  }
  const getRecords = (id) => {
    return {
      text: `SELECT * FROM records WHERE userid = $1`,
      values: [id]
    }
  }

  try {
      const user = await db.query(getUserInfo(partnerId));
      const partner = await db.query(getUserInfo(userId));
      const userData = await db.query(getRecords(userid));
      const partnerData = await db.query(getRecords(partnerid));
      if (partner.rows.length > 0) {
          res.json({"success": true, "userInfo": user.rows[0], "partnerInfo": partner.rows[0], "userData": userData.rows, "partnerData": partnerData.rows});
      }
      else {
          console.log("Not synced to partner");
          res.json({"success": false, "message": "Not synced to a partner"});
      }
  }
  catch(err) {
      console.log("ERROR /data: ", err);
      res.json({"success": false, "message" : "Failed to get bedtime records"});
  }

})

//
// Insert or update todays bedtime
app.post('/bedtime', async (req, res) => {
    const { userid, partnerid, date, time, message } = req.body;

    const checkToday = (id) => {
        return {
          text: `SELECT * FROM records WHERE userid = $1 AND date = $2`,
          values: [id, date]
        }
    }
    const addBedTime = {
      text: `INSERT INTO records (userid, date, bedtime, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      values: [userid, date, time, message]
    }
    const updateBedTime = {
        text: `UPDATE records SET bedtime = $1, message = $2 WHERE userid = $3 AND date = $4 RETURNING *`,
        values: [time, message, userid, date]
    }

    try {
        const userToday = await db.query(checkToday(userid));
        const partnerToday = await db.query(checkToday(partnerid));
        const partnerInfo = partnerToday.rows.length > 0 ? partnerToday.rows[0] : false;
        if (userToday.rows.length > 0) {
            const update = await db.query(updateBedTime);
            res.json({"success": true, "userInfo": update.rows[0], "partnerTodayInfo": partnerInfo});
        }
        else {
            const insert = await db.query(addBedTime);
            res.json({"success": true, "dayInfo": insert.rows[0], "partnerTodayInfo": partnerInfo});
        }
    }
    catch(err) {
        console.log("ERROR /bedtime: ", err);
        res.json({"success": false, "message": "Could not update bedtime"});
    }
})

app.listen(3001);
