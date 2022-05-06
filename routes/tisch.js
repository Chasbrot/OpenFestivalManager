var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/tisch_neu', function (req, res) {
  if (req.session.personal_id) {
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }

      res.render("tisch/tisch_neu", { table_groups: groups });
    });
  } else {
    res.redirect("/personal/personal_overview");
  }
});


router.get('/tisch_overview', function (req, res) {
  if (req.session.personal_id) {
    res.render("tisch/tisch_overview");
  } else {
    res.redirect("/personal/personal_overview");
  }

});

router.get('/tisch_kassieren', function (req, res) {
  if (req.session.personal_id) {
    res.render("tisch/tisch_kassieren");
  } else {
    res.redirect("/personal/personal_overview");
  }
});


module.exports = router;
