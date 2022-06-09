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

router.get('/getActiveOrdersCount', function (req, res) {
    var sql = 'SELECT COUNT(id) AS c FROM bestellung\
    WHERE bestellung.erledigt IS NULL AND bestellung.stoniert = false';
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows[0].c
                });
            }
        });
});

// Count all active sessions
router.get('/getActiveSessionsCount', function (req, res) {
    var sql = "SELECT COUNT(id) AS c FROM sitzung WHERE end IS NULL";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows[0].c
                });
            }
        });
});

// Count all tables
router.get('/getTablesCount', function (req, res) {
    var sql = "SELECT COUNT(id) AS c FROM tisch";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows[0].c
                });
            }
        });
});

// Count all sessions today
router.get('/getSessionsTodayCount', function (req, res) {
    var sql = "SELECT COUNT(id) AS c FROM sitzung WHERE end IS NOT NULL AND DATEDIFF(DATE(end),NOW())=0";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows[0].c
                });
            }
        });
});

// Count all orders today
router.get('/getOrdersTodayCount', function (req, res) {
    var sql = "SELECT COUNT(id) AS c FROM bestellung WHERE erledigt IS NOT NULL AND DATEDIFF(DATE(erledigt),NOW())=0";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows[0].c
                });
            }
        });
});

// Count all orders today
router.get('/alerttypes', function (req, res) {
    var sql = "SELECT * FROM alerttype";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows
                });
            }
        });
});

// Count all orders today
router.get('/options', async function (req, res) {
    var sql = "SELECT * FROM Zutat";
    db.query(sql,
     (err, rows) => {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows
                });
            }
        });
});

// Count all orders today
router.get('/alerts', function (req, res) {
    var sql = "SELECT alert.id, alerttype.name, TIME_FORMAT(alert.triggered, '%H:%i') as triggered, Stand.name as stationname  FROM alert \
    INNER JOIN AlertType ON Alert.id_alerttype = AlertType.id \
    INNER JOIN Stand ON Stand.id = Alert.id_station \
    WHERE alert.active";
    db.query(sql,
        function (err, rows) {
            if (err) {
                console.log(err)
                res.sendStatus(500)
            } else {
                res.json({
                    data: rows
                });
            }
        });
});

router.post('/alert', (req, res) => {
    const body = req.body;
    console.log(body)

    if (body.clearAlert) {
        db.clearAlert(body.clearAlert)
            .then(() => {
                res.sendStatus(200);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500)
            })
    }
});

// Count all orders today
router.get('/product/station/:sid', function (req, res) {
    db.getProductsByStation(req.params.sid)
            .then((result) => {
                res.json({
                    data: result
                });
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500)
            })
});

// Count all orders today
router.get('/product/:pid', function (req, res) {
    db.getProduct(req.params.pid)
            .then((result) => {
                res.json({
                    data: result
                });
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500)
            })
});

module.exports = router;
