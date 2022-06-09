var express = require('express');
const {
  redirect
} = require('express/lib/response');
var router = express.Router();
var db = require("../database");

router.get('/new', function (req, res) {
  if (req.session.personal_id) {
    // Lade Tischgruppen
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }
      res.render("table/table_new", {
        table_groups: groups
      });
    });
  } else {
    res.redirect("/personal/overview");
  }
});


router.post('/new', function (req, res) {
  const body = req.body;
  if (req.session.personal_id) {

    // Neue Sitzung erzeugen

    if (body.table_group && body.table && body.new_session) {

      // Check if current sitzung?
      var sql = `SELECT id FROM Sitzung WHERE end IS NULL AND id_tisch = ${body.table}`;
      db.query(sql, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          if (result.length != 0) {
            // Es gibt eine aktive Sitzung -> Meinem Katalog hinzufügen und öffnen
            // Link session to my account
            db.mapSessionToAccount(result[0].id, req.session.personal_id).then(() => {
              console.log("Session linked to account");
              res.redirect("/table/" + result[0].id);
            }).catch(err => {
              console.log(err);
              res.redirect("/table/" + result[0].id);
            });
          } else {
            // Es gibt keine aktive Sitzung -> Neue Erstellen, hinzufügen und öffnen
            // Create new session
            db.createSession(body.table, req.session.personal_id).then(result => {
              console.log("New session created")
              res.redirect("/table/" + result);
            }).catch(err => {
              console.log(err);
              res.redirect("/table/new");
            });
          }
        }
      });

    } else {
      res.redirect("/table/new");
    }

  } else {
    res.redirect("/personal/overview");
  }
});

router.get('/move/:sid', function (req, res) {
  if (req.session.personal_id) {
    // Lade Tischgruppen
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }
      res.render("table/table_move", {
        table_groups: groups,
        err: null
      });
    });
  } else {
    res.redirect("/personal/login");
  }
});

router.post('/move/:sid', function (req, res) {
  const body = req.body;
  console.log(body)
  if (req.session.personal_id) {
    if (body.table && body.move_session) {
      // Check if current sitzung?
      db.getActiveSessionFromTable(body.table)
        .then((result) => {
          // Active session on target table detected
          console.log(result)
          if (result != -1) {
            // Check if merge with self
            if (result == req.params.sid) {
              db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
                if (err) {
                  console.log(err);
                }
                res.render("table/table_move", {
                  table_groups: groups,
                  err: "Can't merge with self"
                });
              });
            } else {
              // Move all orders to new session and remove session + mappings
              console.log("table/move: moving session " + req.params.sid + " to target session " + result)
              db.mergeSession(req.params.sid, result).then(err => {
                res.redirect("/personal/overview");
              }).catch(err => {
                console.log("table/move: Can't merge sessions \n" + err)
                res.redirect("/table/move/" + req.params.sid);
              });
            }
          } else {
            // No active session on target table
            db.changeSessionTable(req.params.sid, body.table)
              .then(err => {
                res.redirect("/personal/overview");
              }).catch(err => {
                console.log("table/move: Can't move session " + err)
                res.redirect("/table/move/" + req.params.sid);
              });
          }
        })
        .catch((err) => {
          console.log("table/move: Can't move session " + err)
          res.redirect("/table/move/" + req.params.sid);
        });
    } else {
      db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
        if (err) {
          console.log(err);
        }
        res.render("table/table_move", {
          table_groups: groups,
          err: "Kein Tisch ausgewählt"
        });
      });
    }
  } else {
    res.redirect("/personal/login");
  }
});


router.get('/bill', function (req, res) {
  if (req.session.personal_id) {
    // Load orders
    console.log(req.session.session_overview)
    db.getBillableOrders(req.session.session_overview).then(result => {
      if (result.length == 0) {
        console.log("payment session " + req.params.sid + " no orders found")
      }
      res.render("table/table_bill", {
        session_id: req.session.session_overview,
        orders: result
      });
    }).catch(err => {
      console.log("table/bill: Can't get orders \n" + err)
      res.redirect("/table/" + req.params.sid);
    });

  } else {
    res.redirect("/personal/overview");
  }
});


router.post('/bill', function (req, res) {
  if (req.session.personal_id) {
    console.log(req.body)
    const body = req.body;
    if (body.payOrder) {
      // Get all keys from the request
      var keys = Object.keys(body);
      keys.forEach(element => {
        var x = parseInt(element);
        // Check if it is a product payment request
        if (!isNaN(x) && body[x] != 0) {
          var pid = x;
          var anz = body[x];
          // Pay orders with requested product amount
          payOrder(anz, pid, req.session.session_overview)
        }
      });
      res.redirect("/table/bill");
    } else if (body.closeSession) {
      // Close session
      console.log("closing session: " + req.session.session_overview)
      db.closeSession(req.session.session_overview, req.session.personal_id)
        .then(() => {
          res.redirect("/personal/overview");
        })
        .catch((err) => {
          console.log(err)
          res.redirect("/table/bill");
        })
    } else {
      res.redirect("/table/bill");
    }
  } else {
    res.redirect("/personal/overview");
  }
});

router.get('/:sid', function (req, res) {
  if (req.session.personal_id) {
    // Check if session exists
    var sql = `SELECT * FROM sitzung\
    INNER JOIN tisch\
    ON sitzung.id_tisch = tisch.id\
    WHERE sitzung.id = ${req.params.sid}`;
    db.query(sql, function (err, result) {
      if (err) {
        console.log(err)
      } else {
        if (result[0]) {
          // Load all orders from this session with their data
          var sql = `SELECT bestellung.id AS id, bestellung.erstellt, bestellung.erledigt, bestellung.in_zubereitung,  bestellung.anzahl, bestellung.stoniert, gericht.name, gericht.lieferbar\
          FROM bestellung\
          INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
          WHERE bestellung.id_sitzung = ${req.params.sid}\
          ORDER BY bestellung.erstellt DESC`;
          db.query(sql, function (err, orders) {
            if (err) {
              console.log(err)
            } else {
              if (orders.length == 0) {
                console.log("session " + req.params.sid + " no orders found")
              }
              // Load all stations in 
              var sql = `SELECT * FROM stand`;
              db.query(sql, function (err, stations) {
                if (err) {
                  console.log(err)
                } else {
                  req.session.session_overview = req.params.sid // save overview id to session
                }
                res.render("table/table_overview", {
                  t_name: result[0].nummer,
                  orders: orders,
                  stations: stations
                });
              });
            }
          });
        } else {
          console.log("session " + req.params.tid + " not found")
          res.redirect("/personal/overview");
        }
      }
    });



  } else {
    res.redirect("/personal/overview");
  }
});


router.post('/:sid', function (req, res) {
  console.log(req.body)
  const body = req.body;
  var sql;
  if (req.session.personal_id) {
    var sid = req.params.sid;

    if (req.body.cancelOrder) {
      // Cancel order
      sql = `UPDATE bestellung  SET stoniert=true WHERE id=${req.body.cancelOrder}`;
      db.query(sql, function (err, orders) {
        if (err) {
          console.log(err)
        } else {
          console.log("order " + req.body.cancelOrder + " canceled")
          res.redirect("/table/" + sid);
        }
      });
    } else if (body.productid) {
      if (body.product_anzahl != 0) {
        db.createOrder(req.session.personal_id, req.session.session_overview, body.productid, body.product_anzahl, body.notiz, body.option)
          .catch(err => {
            console.log(err)
          });
      }
      res.redirect("/table/" + sid);
    } else if (body.finishOrder) {
      console.log("finish order" + body.finishOrder)
      sql = `UPDATE bestellung SET erledigt = NOW() WHERE id = ${body.finishOrder}`;
      db.query(sql, function (err, result) {
        if (err) {
          console.log(err)
        }
        res.redirect("/table/" + sid);
      });
    }
  } else {
    res.redirect("/personal/overview");
  }
});






/*
 * Recursive Payment Function
 * Pay Orders until the requested amount of a product in a session is paid
 */
function payOrder(remaining, productid, sessionid) {
  console.log("payOrder: start " + remaining + " remaining")
  // Get a possible order from the db
  var sql = `SELECT bestellung.id, (anzahl - bezahlt) AS rem, anzahl, bezahlt from bestellung WHERE bestellung.id_sitzung =${sessionid} AND bestellung.id_gericht=${productid} AND (anzahl-bezahlt) > 0 AND stoniert=false LIMIT 1;`;
  db.query(sql, function (err, orders) {
    if (err) throw err;
    if (orders.length == 0) {
      console.log("payment session " + sessionid + " no orders found")
    } else {
      console.log("payOrder: possible " + orders[0].rem)
      // Check proceeding
      if (remaining - orders[0].rem == 0) {
        // Pay and return
        console.log("payOrder: all paid -> returning")
        sql = `UPDATE bestellung SET bezahlt=${orders[0].anzahl} WHERE id = ${orders[0].id};`;
        db.query(sql, function (err, orders) {
          if (err) {
            console.log(err)
          }
        });
        return;
      } else if (remaining - orders[0].rem > 0) {
        // Pay and recursive
        console.log("payOrder: paid " + orders[0].rem + " -> continuing")
        sql = `UPDATE bestellung SET bezahlt=${orders[0].anzahl} WHERE id = ${orders[0].id};`;
        db.query(sql, function (err, orders) {
          if (err) {
            console.log(err)
          }
        });
        payOrder(remaining - orders[0].rem, productid, sessionid);
      } else if (remaining - orders[0].rem < 0) {
        // Pay partial and return
        console.log("payOrder: paid partial order " + orders[0].rem + " -> returning")
        sql = `UPDATE bestellung SET bezahlt=${orders[0].bezahlt + remaining} WHERE id = ${orders[0].id};`;
        db.query(sql, function (err, orders) {
          if (err) {
            console.log(err)
          }
        });
      }
    }
  });
}


router.get('/productlist/:sid', function (req, res) {
  // Lade Gerichte
  var sql = `SELECT * FROM Gericht WHERE id_stand=${req.params.sid}`;
  db.query(sql, function (err, prods) {
    if (err) {
      console.log(err);
    }
    // Lade Gericht_Zuaten und Zutaten
    var sql = `SELECT * FROM Gericht_Zutaten INNER JOIN Zutat ON Gericht_Zutaten.id_zutat = Zutat.id`;
    db.query(sql, function (err, zutaten) {
      if (err) {
        console.log(err);
      } else {
        // Allen Produkten ihre Zutaten zuteilen. Keine bessere Idee, aber die listen sind eh ned so groß
        for (var p = 0; p < prods.length; p++) {
          prods[p].zutaten = [];
          for (var z = 0; z < zutaten.length; z++) {
            if (zutaten[z].id_gericht == prods[p].id) {
              if (prods[p].zutaten) {
                prods[p].zutaten.push(zutaten[z]);
              }
            }
          }
        }
        // Lade aktuelle Wartezeit
        var sql = `SELECT AVG(TIMESTAMPDIFF(MINUTE, bestellung.erstellt, bestellung.erledigt)) as dauer\
        FROM bestellung \
        INNER JOIN gericht ON gericht.id = bestellung.id_gericht\
        INNER JOIN stand ON gericht.id_stand = stand.id\
        WHERE stand.id= ${req.params.sid} AND bestellung.erledigt IS NOT NULL AND TIMESTAMPDIFF(MINUTE, bestellung.erledigt, NOW()) < 30`;
        db.query(sql, function (err, wartezeit) {
          if (err) {
            console.log(err);
          }
          var d = parseFloat(wartezeit[0].dauer)
          if (isNaN(d)) {
            d = 0;
          }

          res.render("table/productlist", {
            products: prods,
            currentWaitTime: d.toFixed(0)
          });
        });
      }

    });
  });
});


module.exports = router;