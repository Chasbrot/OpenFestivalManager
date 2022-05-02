var express = require('express');
var router = express.Router();



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
router.get('/login_personal.html', function (req, res) {
  res.sendFile(__dirname + "/login_personal.html");
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
router.get('/admin.html', function (req, res) {
  res.sendFile(__dirname + "/admin.html");
});
router.get('/admin_configuration.html', function (req, res) {
  res.sendFile(__dirname + "/admin_configuration.html");
});

router.get('/admin_orderdata.html', function (req, res) {
  res.sendFile(__dirname + "/admin_orderdata.html");
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


router.get('/registrierung_personal.html', function (req, res) {
  res.sendFile(__dirname + "/registrierung_personal.html");
});

router.post('/registrierung_personal', function (req, res) {
  res.sendFile(__dirname + "/login_personal.html");
});


module.exports = router;
