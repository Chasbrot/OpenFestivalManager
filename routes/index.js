var express = require('express');
var router = express.Router();
var db = require("../database");


/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Willkommen zum Bestellsystem!', kellner: "kellner",stand: "stand", admin: "admin"});
});

/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/

module.exports = router;
