var express = require('express');
var router = express.Router();
var db = require("../database");


/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Willkommen zum Bestellsystem!', kellner: "kellner",stand: "stand", admin: "admin"});
});

router.get('/kellner.js', function (req, res) {
  res.render('kellner');
});


router.get('/registrierung_personal.html', function (req, res) {
  res.sendFile(__dirname + "/registrierung_personal.html");
});
router.get('/login_personal', function (req, res) {
  res.render("login_personal");
});

router.get('/station_overview.html', function (req, res) {
  res.sendFile(__dirname + "/station_overview.html");
});

router.get('/login_station.html', function (req, res) {
  res.sendFile(__dirname + "/login_station.html");
});


router.get('/login_admin.html', function (req, res) {
  res.sendFile(__dirname + "/login_admin.html");
});


router.get('/personal_overview.html', function (req, res) {
  res.sendFile(__dirname + "/personal_overview.html");
});

router.get('/tisch_neu.html', function (req, res) {
  res.sendFile(__dirname + "/tisch_neu.html");
});


router.get('/tisch_overview.html', function (req, res) {
  res.sendFile(__dirname + "/tisch_overview.html");
});

router.get('/tisch_kassieren.html', function (req, res) {
  res.sendFile(__dirname + "/tisch_kassieren.html");
});

/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/


router.get('/registrierung_personal', function (req, res) {
  if (global.registrationActive) {
    res.render("registrierung_personal");
  } else {
    res.redirect("login_personal");
  }
  
});

router.post('/registrierung_personal', function (req, res, next) {
  // store all the user input data
  const userDetails = req.body;
  console.log(userDetails);
 
  // insert user data into users table
  var sql = `INSERT INTO account VALUES (0,"${userDetails.name}","",3)`;
  db.query(sql, function(err, result) {
    if (err) throw err;
    console.log('record inserted');
  });

 res.redirect("/login_personal");  // redirect to user form page after inserting the data
}); 


module.exports = router;
