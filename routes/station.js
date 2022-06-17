var express = require('express');
var router = express.Router();
var db = require("../database");
const { options } = require('./personal');


router.get('/', async function (req, res) {
  if (req.session.station_id) {
    var active, past;
    try {
      active = await db.getActiveOrdersForStation(req.session.station_id)
      past = await db.getPastOrdersForStation(req.session.station_id)
    } catch (e) {
      console.log(e)
    }
    res.render("station/station_overview", { station_name: req.session.station_name, station_id: req.session.station_id, act_orders: active, pre_orders: past });
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
      db.setOrderStatusSent(body.sendingOrder)
        .catch((err) => {
          console.log(err);
        })
    }

    // Order is being processed
    if (body.processingOrder) {
      db.setOrderStatusProcessing(body.processingOrder)
        .catch((err) => {
          console.log(err);
        })
    }

    // Order is being canceled because not deliverable
    if (body.cancelOrder) {
      db.setOrderStatusCancled(body.cancelOrder)
      .catch((err) => {
        console.log(err);
      })
    }

    // Make help request
    if (body.makeAlert) {
      db.createAlert(body.makeAlert, req.session.station_id)
        .catch((err) => {
          console.log(err);
      })
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
      // If order is finished cache the entry
      if (order[0].erledigt || order[0].stoniert) {
        res.set('Cache-control', `max-age=300`)
      }
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