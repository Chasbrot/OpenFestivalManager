var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/login', function (req, res) {
    res.render("personal/login_personal", { err: false });
});

router.post('/login', function (req, res, next) {
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
        res.render("personal/login_personal", { err: true });  // redirect to user form page after inserting the data
    }

});


router.get('/personal_overview', function (req, res) {
    if (!req.session.personal_id) {
        res.redirect("/personal/login");
    } else {

        // Get Active Sessions
        var sql = `SELECT sitzung.id AS s_id, tisch.id AS t_id, tisch.nummer AS t_nr,tisch_gruppe.groupname AS t_name, TIME_FORMAT(sitzung.start, '%H:%i') AS start\
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
            // Get Past Sessions
            var sql = `SELECT sitzung.id AS s_id, tisch.id AS t_id, tisch.nummer AS t_nr,tisch_gruppe.groupname AS t_name, TIME_FORMAT(sitzung.end, '%H:%i') AS end \
            FROM sitzung \
            INNER JOIN account_sitzung \
            ON account_sitzung.id_sitzung = sitzung.id\
            INNER JOIN tisch\
            ON tisch.id = sitzung.id_tisch\
            INNER JOIN tisch_gruppe\
            ON tisch.id_tischgruppe = tisch_gruppe.id\
            WHERE id_account=${req.session.personal_id} AND end IS NOT NULL AND DATEDIFF(DATE(sitzung.end),NOW())=0`;
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
        res.redirect("/personal/login");
        return;
    }

    res.render("personal/personal_overview");
});


router.get('/registrierung', function (req, res) {
    if (global.registrationActive) {
        res.render("personal/registrierung_personal", {err: false});
    } else {
        res.redirect("/personal/login");
    }

});

router.post('/registrierung', function (req, res, next) {
    // store all the user input data
    const userDetails = req.body;
    console.log(userDetails);

    // Check if username as personal exists
    var sql = `SELECT * FROM account WHERE name="${userDetails.name}" AND id_type=3`;
    db.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length == 0) {
            // insert user data into users table
            var sql = `INSERT INTO account VALUES (0,"${userDetails.name}","",3)`;
            db.query(sql, function (err, result) {
                if (err) throw err;
                console.log('record inserted');
            });
            res.redirect("/personal/login");  // redirect to user form page after inserting the data
        } else {
            res.render("personal/registrierung_personal", {err: true});
        }
    });



    
});


module.exports = router;
