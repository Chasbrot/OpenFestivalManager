var express = require('express');
var router = express.Router();
var db = require("../database");


/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Willkommen zum Bestellsystem!', kellner: "kellner",stand: "stand", admin: "admin"});
});

router.get('/station_overview.html', function (req, res) {
  res.sendFile(__dirname + "/station_overview.html");
});

router.get('/login_station.html', function (req, res) {
  res.sendFile(__dirname + "/login_station.html");
});

/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/

module.exports = router;
