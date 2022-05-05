var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/login_personal', function (req, res) {
    res.render("personal/login_personal");
});


router.get('/personal_overview', function (req, res) {
    res.render("personal/personal_overview");
});


router.get('/registrierung_personal', function (req, res) {
    if (global.registrationActive) {
        res.render("personal/registrierung_personal");
    } else {
        res.redirect("login_personal");
    }

});

router.post('/registrierung_personal', function (req, res, next) {
    // store all the user input data
    const userDetails = req.body;
    console.log(userDetails);

    // insert user data into users table
    var sql = `INSERT INTO account VALUES (0,"${userDetails.name}","",3)`;
    db.query(sql, function (err, result) {
        if (err) throw err;
        console.log('record inserted');
    });

    res.redirect("personal/login_personal");  // redirect to user form page after inserting the data
});


module.exports = router;
