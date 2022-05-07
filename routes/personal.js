var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/login_personal', function (req, res) {
    res.render("personal/login_personal");
});

router.post('/login_personal', function (req, res, next) {
    // check username
    if (req.body.username) {
        var sql = `SELECT id,name FROM account WHERE name ="${req.body.username}" AND id_type= 3`;
        db.query(sql, function (err, result) {
            if (err) throw err;
            if (result[0]) {
                req.session.personal_id = result[0].id;
                req.session.personal_name = result[0].name;
                res.redirect("/personal/personal_overview");
                return;
            }
        });
    } else {
        res.render("personal/login_personal");  // redirect to user form page after inserting the data
    }

});


router.get('/personal_overview', function (req, res) {
    if (!req.session.personal_id) {
        res.redirect("/personal/login_personal");
    } else {

        // Get Active Sessions
        var sql = `SELECT sitzung.id AS s_id, tisch.id AS t_id, tisch.nummer AS t_nr,tisch_gruppe.groupname AS t_name\
        FROM sitzung \
        INNER JOIN account_sitzung \
        ON account_sitzung.id_sitzung = sitzung.id\
        INNER JOIN tisch\
        ON tisch.id = sitzung.id_tisch\
        INNER JOIN tisch_gruppe\
        ON tisch.id_tischgruppe = tisch_gruppe.id\
        WHERE id_account=${req.session.personal_id} AND end IS NULL`;
        db.query(sql, function (err, activeSessions) {
            if (err) {
                console.log(err);
            }
            // Get Active Sessions
            var sql = `SELECT sitzung.id AS s_id, tisch.id AS t_id, tisch.nummer AS t_nr,tisch_gruppe.groupname AS t_name\
            FROM sitzung \
            INNER JOIN account_sitzung \
            ON account_sitzung.id_sitzung = sitzung.id\
            INNER JOIN tisch\
            ON tisch.id = sitzung.id_tisch\
            INNER JOIN tisch_gruppe\
            ON tisch.id_tischgruppe = tisch_gruppe.id\
            WHERE id_account=${req.session.personal_id} AND end IS NOT NULL`;
            db.query(sql, function (err, inactiveSessions) {
                if (err) {
                    console.log(err);
                }
                res.render("personal/personal_overview", { personal_name: req.session.personal_name, act_sessions: activeSessions, past_sessions: inactiveSessions });
            });
        });

        // Get inactive tables
        var inactiveSessions;




    }
});

router.post('/personal_overview', function (req, res) {
    // Logout request
    if (req.body.logout) {
        req.session.destroy(function (err) {
            console.log(err)
            console.log("session destroyed")
        });
        res.redirect("/personal/login_personal");
        return;
    }

    res.render("personal/personal_overview");
});


router.get('/registrierung_personal', function (req, res) {
    if (global.registrationActive) {
        res.render("personal/registrierung_personal");
    } else {
        res.redirect("/personal/login_personal");
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

    res.redirect("/personal/login_personal");  // redirect to user form page after inserting the data
});


module.exports = router;
