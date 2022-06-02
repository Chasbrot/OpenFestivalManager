var express = require('express');
var router = express.Router();
var db = require("../database");

/*
* Provides json based data access to the application
* Used for ajax loads
*/

router.post('/getSessionsForTable', function (req, res) {
    if (!req.body.table_id) {
        res.json({
            msg: 'error'
        });
        return;
    }
    var sql = `SELECT sitzung.id, TIME_FORMAT(sitzung.start,"%H:%i") AS start, TIME_FORMAT(sitzung.end,"%H:%i") AS ende, account.name FROM sitzung\
    INNER JOIN account_sitzung ON account_sitzung.id_sitzung=sitzung.id\
    INNER JOIN account ON account_sitzung.id_account=account.id\
    WHERE id_tisch=${req.body.table_id}\
    ORDER BY start DESC`;
    db.query(sql,
        function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({
                    msg: 'error'
                });
            } else {
                res.json({
                    msg: 'success',
                    sessions: rows
                });
            }
        });
});

router.post('/getTablesFromTableGroup', function (req, res) {
    if (!req.body.group_id) {
        res.json({
            msg: 'error'
        });
        return;
    }
    var sql = `SELECT * FROM Tisch WHERE id_tischgruppe=${req.body.group_id}`;
    db.query(sql,
        function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({
                    msg: 'error'
                });
            } else {
                res.json({
                    msg: 'success',
                    tables: rows
                });
            }
        });
});


/*
* Get all Tables from a Group where a personal has no associated session
*/
router.post('/getFreeTablesFromGroupForPersonal', function (req, res) {
    if (!req.body.group_id) {
        res.json({
            msg: 'error'
        });
        return;
    }
    var sql = `SELECT *
        FROM Tisch
        WHERE Tisch.id_tischgruppe= ${req.body.group_id} AND Tisch.id NOT IN 
        (
            SELECT Tisch.id FROM Tisch
            INNER JOIN Sitzung ON Sitzung.id_tisch = Tisch.id
            INNER JOIN account_sitzung ON account_sitzung.id_sitzung = Sitzung.id
            WHERE Sitzung.end IS NULL AND account_sitzung.id_account = ${req.session.personal_id}
        );`;
    db.query(sql,
        function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({
                    msg: 'error'
                });
            } else {
                res.json({
                    msg: 'success',
                    tables: rows
                });
            }
        });
});

/*
* Get all Tables from a Group where no session
*/
router.post('/getFreeTablesFromGroup', function (req, res) {
    if (!req.body.group_id || !req.session.personal_id) {
        res.json({
            msg: 'error'
        });
        return;
    }
    var sql = `SELECT *
        FROM Tisch
        WHERE Tisch.id_tischgruppe= ${req.body.group_id} AND Tisch.id NOT IN 
        (
            SELECT Tisch.id FROM Tisch
            INNER JOIN Sitzung ON Sitzung.id_tisch = Tisch.id
            INNER JOIN account_sitzung ON account_sitzung.id_sitzung = Sitzung.id
            WHERE Sitzung.end IS NULL
        );`;
    db.query(sql,
        function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({
                    msg: 'error'
                });
            } else {
                res.json({
                    msg: 'success',
                    tables: rows
                });
            }
        });
});


router.post('/getOrdersFromSession', function (req, res) {
    console.log(req.body)
    if (!req.body.session_id) {
        res.json({
            msg: 'error'
        });
        return;
    }
    var sql = `SELECT bestellung.id,bestellung.erstellt, bestellung.erledigt,bestellung.in_zubereitung, bestellung.anzahl, bestellung.stoniert, gericht.name  FROM Bestellung\
    INNER JOIN Gericht ON Gericht.id = bestellung.id_gericht\
    WHERE id_sitzung=${req.body.session_id}`;
    db.query(sql,
        function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({
                    msg: 'error'
                });
            } else {
                res.json({
                    msg: 'success',
                    orders: rows
                });
            }
        });
});



router.post('/getDailyLoadForStation', function (req, res) {
    if (!req.body.date && !req.body.stationid) {
        res.sendStatus(404)
        return;
    }
    var sql = `SELECT SUM(bestellung.anzahl) AS anzahl, TIME_FORMAT(bestellung.erstellt,"%H") AS hour FROM bestellung \
    INNER JOIN Gericht ON gericht.id = bestellung.id_gericht\
    WHERE DATE(erledigt) = '${req.body.date}' AND gericht.id_stand=${req.body.stationid}\
    GROUP BY hour`;
    db.query(sql, function (err, rows) {
        if (err) {
            console.log(err)
            res.sendStatus(500)
        } else {
            res.json({
                load: rows
            });
        }
    });
});

router.get('/getAllStations', function (req, res) {
    var sql = `SELECT * FROM stand`;
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    stations: rows
                });
            }
        });
});


module.exports = router;
