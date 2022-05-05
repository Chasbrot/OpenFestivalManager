var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/tisch_neu', function (req, res) {
    res.render("tisch/tisch_neu");
  });
  
  
  router.get('/tisch_overview', function (req, res) {
    res.render("tisch/tisch_overview");
  });
  
  router.get('/tisch_kassieren', function (req, res) {
    res.render("tisch/tisch_kassieren");
  });


module.exports = router;
