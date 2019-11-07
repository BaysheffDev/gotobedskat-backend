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
  const validatePartner = (partnerid) => {
     return {
         text: `SELECT * FROM users where id = $1`,
         values: [partnerid]
     }
  }

  try {
    const user = await db.query(validateUser);
    // Check that the user exists
    if (user.rows.length > 0) {
        // Check if user has succesfully added partner credentials
        if (user.rows[0].partnerid) {
            userid = user.rows[0].id;
            partnerid = user.rows[0].partnerid;
            try {
              const partner = await db.query(validatePartner(partnerid));
              console.log(partner.rows[0]);
              if (partner.rows[0].partnerid == userid) {
                res.json({"success": true, "userinfo": user.rows[0], "partnerinfo": partner.rows[0]});
              }
              else {
                res.json({"success": true, "userinfo": user.rows[0], "partnerinfo": partner.rows[0]});
              }
            }
            catch(err) {
              console.log("ERROR /loginuser partner: ", err);
            }
        }
        else {
            res.json({"success": true, "userinfo": user.rows[0]});
        }
    }
    else {
        res.json({"success": false});
    }
  }
  catch(err) {
      console.log("ERROR /loginuser user: ", err);
  }
})

//
// Sync with Partner
// Syncing with someone will replace their existing partner
app.post('/sync', async (req, res) => {

  const { userid, partnername, partnercode } = req.body;
  let partnerId = "";
  let partnerInfo = "";

  const checkPartner = {
    text: `SELECT * FROM users WHERE username = $1 AND usercode = $2`,
    values: [partnername, partnercode]
  }
  const syncPartner = (idToFind, idToSync) => {
    return {
      text: `UPDATE users SET partnerid = $1 WHERE id = $2`,
      values: [idToFind, idToSync]
    }
  }

  // Check partner credentials exist
  try {
    const partner = await db.query(checkPartner);
    partnerInfo = partner.rows[0];
    partnerId = partner.rows.length > 0 ? partner.rows[0].id : false;
  }
  catch(err) {
    console.log("ERROR 1 /sync: ", err);
  }
  // If partner credentials exist, sync user to partner
  if (partnerId && partnerId != userid) {
    try {
      const syncUserToPartner = await db.query(syncPartner(partnerId, userid));
      res.json({"success": true, "partnerinfo": partnerInfo});
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

// Check if partner has synced
app.post('/checksync', async (req, res) => {
  const { userid } = req.body;

  const getUser = (id) => {
    return {
      text: `SELECT partnerid FROM users WHERE id = $1`,
      values: [id]
    }
  }

  try {
    const partnerId = await db.query(getUser(userid));
    const partnerSynced = await db.query(getUser(partnerId.rows[0].partnerid));
    if (partnerSynced.rows[0].partnerid == userid) {
      res.json({"success": true, "partnerid": partnerId.rows[0].partnerid});
    }
    else {
      res.json({"success": false});
    }
  }
  catch(err) {
    console.log("ERROR /checksync: ", err);
  }
})

// Unsync from partner
app.post('/unsync', async (req, res) => {
  const { userid } = req.body;

  const unsyncPartner = {
      text: `UPDATE users SET partnerid = null WHERE id = $1`,
      values: [userid]
  }

  try {
    const unsync = await db.query(unsyncPartner);
    res.json({"success": true});
  }
  catch(err) {
    console.log("ERROR 1 /sync: ", err);
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

// Update setting
app.post('/update/:setting', async (req, res) => {
  const { userid, setting } = req.body;

  const updateSetting = {
    text: `UPDATE users SET ${req.params.setting} = $1 WHERE id = $2`,
    values: [setting, userid]
  }

  try {
    const update = db.query(updateSetting);
    res.json({"success": true, "setting": update.rows[0][setting]});
  }
  catch(err) {
    console.log("ERROR /update/user: ", err);
    res.json({"success": false});
  }
})

// Update usercode

// Update usercolor

app.listen(3001);
