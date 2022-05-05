var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/', function (req, res) {

  db.query('SELECT * FROM account', function (err, rows) {
    if (err) {
      console.log("error");
    }
    res.render("admin/admin", { regActive: global.registrationActive, uptime: parseInt(process.uptime()), personal: rows });
  });

});


router.post('/', function (req, res, next) {
  // store all the user input data
  const body = req.body;

  if (body.registrationPersonal == "on") {
    global.registrationActive = true;
  } else {
    global.registrationActive = false;
  }

  res.redirect("admin/admin");  // redirect to user form page after inserting the data
});


router.get('/configuration', function (req, res) {
  res.render("admin/admin_configuration");
});

router.get('/orderdata', function (req, res) {
  res.render("admin/admin_orderdata");
});

router.get('/login_admin', function (req, res) {
  res.render("admin/login_admin");
});



module.exports = router;
