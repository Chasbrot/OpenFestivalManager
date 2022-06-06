var express = require('express');
var router = express.Router();
var db = require("../database");


/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { registrationActive: global.registrationActive });
});

/* GET developer page. */
router.get('/dev', function (req, res) {
  res.render('dev');
});

/* GET developer page. */
router.get('/public', function (req, res) {
  res.render('public_stats');
});


/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/

module.exports = router;
