var express = require('express');
var router = express.Router();
var db = require("../database");
const { options } = require('./personal');


router.get('/', function (req, res) {
  if (req.session.station_id) {
    var sql = `SELECT bestellung.id AS b_id, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,NOW()) AS wartezeit\
        FROM bestellung\
        INNER JOIN gericht\
        ON gericht.id = bestellung.id_gericht\
        INNER JOIN stand\
        ON stand.id = gericht.id_stand\
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
        res.render("station/station_overview", { station_name: req.session.station_name, station_id: req.session.station_id, act_orders: activeOrders, pre_orders: preOrders });
      });
    });

  } else {
    res.redirect("/station/login");
  }

});


router.post('/', function (req, res) {
  const body = req.body;
  if (req.session.station_id) {
    console.log(body)
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
      db.query(sql, function (err, result) {
        if (err) {
          console.log(err);
        }
        res.redirect("/station");
      });
      return;
    }

    // Order is being canceled because not deliverable
    if (body.cancelOrder) {
      var sql = `UPDATE bestellung\
            SET bestellung.stoniert = true\
            WHERE bestellung.id="${body.cancelOrder}"`;
      console.log(sql);
      db.query(sql, function (err, result) {
        if (err) {
          console.log(err);
        }
        res.redirect("/station");
      });
      return;
    }

    // Make help request
    if (body.makeAlert) {
      sql = `INSERT INTO Alert VALUES (0,${body.makeAlert},${req.session.station_id},true,NOW());`;
      console.log(sql);
      db.query(sql, function (err, result) {
        if (err) {
          console.log(err);
        }
      });
    }

    res.redirect("/station");
  } else {
    res.redirect("/station/login");
  }
});


router.get('/login', function (req, res) {
  res.render("station/login_station", { err: false });
});

router.post('/login', function (req, res, next) {
  console.log(req.body)
  // check username
  if (req.body.username) {
    var sql = `SELECT id,name FROM stand WHERE name ="${req.body.username}"`;
    db.query(sql, function (err, result) {
      if (err) {
        console.log(err)
      } else {
        if (result[0]) {
          req.session.station_id = result[0].id;
          req.session.station_name = result[0].name;
          res.redirect("/station");
        } else {
          console.log("station " + req.body.username + " not found")
          res.render("station/login_station", { err: true });
        }
      }
    });
  } else {
    res.render("station/login_station", { err: true });  // redirect to user form page after inserting the data
  }
});


router.get('/orderentry/:oid', function (req, res) {
  if (!req.params.oid) {
    res.json({
      msg: 'error'
    });
    return;
  }

  db.getOrderentry(req.params.oid).then(order => {
    // Get all options from the product of the order and if it was ordered
    db.getSelectedOptions(req.params.oid).then(options => {
      res.render("station/orderentry", { options: options, order: order[0], special: (options.length > 0 || order[0].notiz) });
    }).catch(err => {
      console.log(err)
      res.json({
        msg: 'error'
      });
    });
  }).catch(err => {
    console.log(err)
    res.json({
      msg: 'error'
    });
  });
});

module.exports = router;