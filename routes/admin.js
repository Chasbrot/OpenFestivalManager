var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/', function (req, res) {

    db.query('SELECT * FROM account', function (err, rows) {
      if (err) {
        console.log("error");
      }
      res.render("admin", {regActive: global.registrationActive, uptime: parseInt(process.uptime()), personal: rows });
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
  
   res.redirect("admin");  // redirect to user form page after inserting the data
  }); 
  
  
  router.get('/admin_configuration.html', function (req, res) {
    res.sendFile(__dirname + "/admin_configuration.html");
  });
  
  router.get('/admin_orderdata.html', function (req, res) {
    res.sendFile(__dirname + "/admin_orderdata.html");
  });
module.exports = router;
