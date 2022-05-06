var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/tisch_neu', function (req, res) {
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
        if (err) {
          console.log(err);
        }

        res.render("tisch/tisch_neu", {table_groups: groups});
      });
    
});


router.get('/tisch_overview', function (req, res) {
    res.render("tisch/tisch_overview");
});

router.get('/tisch_kassieren', function (req, res) {
    res.render("tisch/tisch_kassieren");
});


module.exports = router;
