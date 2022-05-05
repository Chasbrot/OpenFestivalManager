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

  res.redirect("/admin");  // redirect to user form page after inserting the data
});


router.get('/configuration', function (req, res) {

  db.query('SELECT * FROM stand', function (err, rows) {
    if (err) {
      console.log("error");
    }

    db.query('SELECT * FROM Zutat', function (err, opts) {
      if (err) {
        console.log("error");
      }

      res.render("admin/admin_configuration", { stations: rows, options: opts });
    });

  });

});

router.post('/configuration', function (req, res) {

  const body = req.body;
  console.log(body);

  if (body.new_station) {
    var sql = `INSERT INTO stand VALUES (0,"${body.new_station}",NULL)`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record inserted');
    });
  }

  if (body.new_option) {
    var sql = `INSERT INTO Zutat VALUES (0,"${body.new_option}")`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record inserted');
    });
  }

  res.redirect("/admin/configuration");

});


router.get('/orderdata', function (req, res) {
  res.render("admin/admin_orderdata");
});

router.get('/login_admin', function (req, res) {
  res.render("admin/login_admin");
});



module.exports = router;
