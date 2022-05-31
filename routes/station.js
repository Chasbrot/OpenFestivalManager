var express = require('express');
var router = express.Router();
var db = require("../database");


router.get('/', function (req, res) {
    if (req.session.station_id) {
        var sql = `SELECT bestellung.id AS b_id, gericht.name AS g_name, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,NOW()) AS wartezeit, bestellung.anzahl AS b_anz, bestellung.erstellt, bestellung.in_zubereitung, tisch.nummer AS t_nr, bestellung.notiz\
        FROM bestellung\
        INNER JOIN gericht\
        ON gericht.id = bestellung.id_gericht\
        INNER JOIN stand\
        ON stand.id = gericht.id_stand\
        INNER JOIN sitzung\
        ON sitzung.id = bestellung.id_sitzung\
        INNER JOIN tisch\
        ON tisch.id = sitzung.id_tisch\
        WHERE stand.id = ${req.session.station_id} AND bestellung.erledigt IS NULL AND bestellung.stoniert = false
        ORDER BY wartezeit DESC`;
        db.query(sql, function (err, activeOrders) {
            if (err) throw err;
            var sql = `SELECT bestellung.id AS b_id, gericht.name AS g_name, bestellung.stoniert, bestellung.anzahl AS b_anz, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,bestellung.erledigt) AS dauer, TIME_FORMAT(bestellung.erledigt, '%H:%i') as lieferzeit, tisch.nummer AS t_nr, bestellung.notiz, TIME_FORMAT(bestellung.erstellt, '%H:%i') as erstellt\
            FROM bestellung\
            INNER JOIN gericht\
            ON gericht.id = bestellung.id_gericht\
            INNER JOIN stand\
            ON stand.id = gericht.id_stand\
            INNER JOIN sitzung\
            ON sitzung.id = bestellung.id_sitzung\
            INNER JOIN tisch\
            ON tisch.id = sitzung.id_tisch\
            WHERE stand.id = ${req.session.station_id} AND (bestellung.erledigt IS NOT NULL OR bestellung.stoniert = true) AND DATEDIFF(DATE(bestellung.erstellt),NOW())=0\
            ORDER BY lieferzeit DESC`;
            db.query(sql, function (err, preOrders) {
                if (err) throw err;
                res.render("station/station_overview_new", { station_name: req.session.station_name, station_id: req.session.station_id, act_orders: activeOrders, pre_orders: preOrders });
            });
        });

    } else {
        res.redirect("/station/login");
    }

});


router.post('/', function (req, res) {
    const body = req.body;
    console.log(body);
    if (req.session.station_id) {
        if (body.logout) {
            req.session.destroy(function (err) {
                console.log(err)
                console.log("station session destroyed")
            });
            res.redirect("/station/login");
            return;
        }
        // Order is sent out
        if (body.sendingOrder) {
            var sql = `UPDATE bestellung\
            SET bestellung.erledigt = NOW()\
            WHERE bestellung.id="${body.sendingOrder}"`;
            console.log(sql);
            db.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/station");
            });
            return;
        }

        // Order is being processed
        if (body.processingOrder) {
            var sql = `UPDATE bestellung\
            SET bestellung.in_zubereitung = true\
            WHERE bestellung.id="${body.processingOrder}"`;
            console.log(sql);
            db.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/station");
            });
            return;
        }
    } else {
        res.redirect("/station/login");
    }
});


router.get('/login', function (req, res) {
    res.render("station/login_station", {err: false});
});

router.post('/login', function (req, res, next) {
    console.log(req.body)
    // check username
    if (req.body.username) {
        var sql = `SELECT id,name FROM stand WHERE name ="${req.body.username}"`;
        db.query(sql, function (err, result) {
            if (err) throw err;
            if (result[0]) {
                req.session.station_id = result[0].id;
                req.session.station_name = result[0].name;
                res.redirect("/station");
            } else {
                console.log("station " + req.body.username + " not found")
                res.render("station/login_station", {err: true});
            }
        });
    } else {
        res.render("station/login_station", {err: true});  // redirect to user form page after inserting the data
    }
});

router.post('/getOptionsFromOrder', function (req, res) {
    console.log(req.body)
    if (!req.body.order_id) {
      res.json({
        msg: 'error'
      });
      return;
    }
    // TODO Only submit differences with standard options
    var sql = `SELECT Zutat.name FROM Zutat_Bestellung
    INNER JOIN Zutat ON  Zutat.id = Zutat_Bestellung.id_zutat
    WHERE Zutat_Bestellung.id_bestellung = ${req.body.order_id}
    ORDER BY Zutat.name`;
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
            options: rows
          });
        }
      });
});
  

router.get('/orderoptions/:sid', function (req, res) {
    if (!req.params.sid) {
      res.json({
        msg: 'error'
      });
      return;
    }
    // TODO Only submit differences with standard options
    var sql = `SELECT Zutat.name FROM Zutat_Bestellung
    INNER JOIN Zutat ON  Zutat.id = Zutat_Bestellung.id_zutat
    WHERE Zutat_Bestellung.id_bestellung = ${req.params.sid}
    ORDER BY Zutat.name`;
    db.query(sql,
      function (err, rows, fields) {
        if (err) {
          console.log(err)
          res.json({
            msg: 'error'
          });
        } else {
            res.render("station/optionsFromOrder", { options: rows });
        }
      });
});
  
router.get('/activeorders/:sid', function (req, res) {
    if (!req.params.sid) {
      res.json({
        msg: 'error'
      });
      return;
    }
    var sql = `SELECT bestellung.id AS b_id, gericht.name AS g_name, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,NOW()) AS wartezeit, bestellung.anzahl AS b_anz, bestellung.erstellt, bestellung.in_zubereitung, tisch.nummer AS t_nr, bestellung.notiz\
    FROM bestellung\
    INNER JOIN gericht\
    ON gericht.id = bestellung.id_gericht\
    INNER JOIN stand\
    ON stand.id = gericht.id_stand\
    INNER JOIN sitzung\
    ON sitzung.id = bestellung.id_sitzung\
    INNER JOIN tisch\
    ON tisch.id = sitzung.id_tisch\
    WHERE stand.id = ${req.params.sid} AND bestellung.erledigt IS NULL AND bestellung.stoniert = false
    ORDER BY wartezeit DESC`;
    db.query(sql,
      function (err, rows, fields) {
        if (err) {
          console.log(err)
          res.json({
            msg: 'error'
          });
        } else {
            res.render("station/activeorders", { act_orders: rows });
        }
      });
  });

module.exports = router;