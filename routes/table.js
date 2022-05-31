var express = require('express');
const { redirect } = require('express/lib/response');
var router = express.Router();
var db = require("../database");

router.get('/new', function (req, res) {
  if (req.session.personal_id) {
    // Lade Tischgruppen
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }
      res.render("table/table_new", { table_groups: groups });
    });
  } else {
    res.redirect("/personal/personal_overview");
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
            sql = `INSERT INTO Account_Sitzung VALUES (0,${req.session.personal_id},${result[0].id})`;
            db.query(sql, function (err, groups) {
              if (err) {
                console.log(err);
              } else {
                console.log("Session linked to account")
              }
            });
            res.redirect("/table/" + result[0].id);

          } else {
            // Es gibt keine aktive Sitzung -> Neue Erstellen, hinzufügen und öffnen
            // Create new session
            sql = `INSERT INTO Sitzung VALUES (0,NOW(),NULL,${body.table},NULL,${req.session.personal_id})`;
            db.query(sql, function (err, groups) {
              if (err) {
                console.log(err);
              } else {
                console.log("New session created")
                // Get ID from new Session
                var sql = `SELECT LAST_INSERT_ID() AS id`;
                db.query(sql, function (err, result) {
                  if (err) {
                    console.log(err);
                  } else {
                    if (result.length != 1) {
                      console.log("Error in getting id from new sitzung")
                      console.log(result)
                    } else {
                      // Link Session to my account
                      var sql = `INSERT INTO Account_Sitzung VALUES (0,${req.session.personal_id},${result[0].id})`;
                      db.query(sql, function (err, groups) {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("Session linked to account")
                        }
                        res.redirect("/table/" + result[0].id);
                      });
                    }

                  }
                });
              }

            });
          }
        }
      });

    }else{
      res.redirect("/table/new");
    }

  } else {
    res.redirect("/personal/personal_overview");
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
        if (err) throw err;
        console.log("order " + req.body.cancelOrder + " canceled")
        res.redirect("/table/" + sid);
      });
    } else if (body.productid) {
      console.log(body)
      if (body.product_anzahl != 0) {
        console.log("order recieved")
        // SAVE Order 
        sql = `INSERT INTO bestellung VALUES (0, ${body.productid}, ${req.session.personal_id}, ${req.session.session_overview}, NOW(),NULL,false,${body.product_anzahl},0,"${body.notiz}",false)`;
        db.query(sql, function (err, result) {
          if (err) throw err;
          console.log("order created")
          if (body.option) {
            //  Get id of last inserted record
            var sql = "SELECT LAST_INSERT_ID() AS id";
            db.query(sql, function (err, result) {
              if (err) throw err;
              if (result[0]) {
                // Create Order - Options Mappings
                for (var i = 0; i < body.option.length; i++) {
                  var sql = `INSERT INTO Zutat_Bestellung VALUES (0,${body.option[i]},${result[0].id})`;
                  db.query(sql, function (err, result) {
                    if (err) throw err;
                  });
                }
              }
            });
          }
        });
      }
      res.redirect("/table/" + sid);
    } else if (body.finishOrder) {
      console.log("finish order" + body.finishOrder)
      sql = `UPDATE bestellung SET erledigt = NOW() WHERE id = ${body.finishOrder}`;
      db.query(sql, function (err, result) {
        if (err) throw err;
        res.redirect("/table/" + sid);
      });
    }
  } else {
    res.redirect("/personal/personal_overview");
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
      if (err) throw err;
      if (result[0]) {
        // Load all orders from this session with their data
        var sql = `SELECT bestellung.id AS id, bestellung.erstellt, bestellung.erledigt, bestellung.in_zubereitung,  bestellung.anzahl, bestellung.stoniert, gericht.name, gericht.lieferbar\
        FROM bestellung\
        INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
        WHERE bestellung.id_sitzung = ${req.params.sid}\
        ORDER BY bestellung.erstellt DESC`;
        db.query(sql, function (err, orders) {
          if (err) throw err;
          if (orders.length == 0) {
            console.log("session " + req.params.sid + " no orders found")
          }
          // Load all stations in 
          var sql = `SELECT * FROM stand`;
          db.query(sql, function (err, stations) {
            if (err) throw err;
            req.session.session_overview = req.params.sid // save overview id to session
            res.render("table/table_overview", { t_name: result[0].nummer, orders: orders, stations: stations });
          });

        });
      } else {
        console.log("session " + req.params.tid + " not found")
        res.redirect("/personal/personal_overview");
      }
    });



  } else {
    res.redirect("/personal/personal_overview");
  }
});



router.get('/bill', function (req, res) {
  if (req.session.personal_id) {
    // Check if there are open orders
    var sql = `SELECT count(*) AS anz FROM bestellung
    WHERE bestellung.id_sitzung = ${req.session.session_overview} AND (bestellung.erledigt IS NULL AND bestellung.stoniert = FALSE)`;
    db.query(sql, function (err, result) {
      if (err) {
        console.log(err);
      }
      if (result[0].anz != 0) {
        console.log("aborting kassieren: "+result[0].anz + " oders are open on session "+ req.session.session_overview)
        res.redirect("/table/" + req.session.session_overview);
      } else {
        // Load orders
        var sql = `SELECT SUM(bestellung.anzahl- bestellung.bezahlt) AS uebrig, gericht.name, gericht.id, gericht.preis\
        FROM bestellung\
        INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
        WHERE bestellung.id_sitzung = ${req.session.session_overview} AND (bestellung.erledigt IS NOT NULL AND bestellung.stoniert=false)  AND (anzahl-bezahlt)>0\
        GROUP BY name`;
        db.query(sql, function (err, orders) {
          if (err) throw err;
          if (orders.length == 0) {
            console.log("session " + req.params.sid + " no orders found")
          }
          res.render("table/bill", { session_id: req.session.session_overview, orders: orders });
        });

      }
    });
  } else {
    res.redirect("/personal/personal_overview");
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
      var sql = `UPDATE sitzung SET end=NOW(), id_abrechner=${req.session.personal_id} WHERE id = ${req.session.session_overview}`;
      db.query(sql, function (err, result) {
        if (err) throw err;
        res.redirect("/personal/personal_overview");
      });

    } else {
      res.redirect("/table/bill");
    }
  } else {
    res.redirect("/personal/personal_overview");
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
        db.query(sql, function (err, orders) { if (err) throw err; });
        return;
      } else if (remaining - orders[0].rem > 0) {
        // Pay and recursive
        console.log("payOrder: paid " + orders[0].rem + " -> continuing")
        sql = `UPDATE bestellung SET bezahlt=${orders[0].anzahl} WHERE id = ${orders[0].id};`;
        db.query(sql, function (err, orders) { if (err) throw err; });
        payOrder(remaining - orders[0].rem, productid, sessionid);
      } else if (remaining - orders[0].rem < 0) {
        // Pay partial and return
        console.log("payOrder: paid partial order " + orders[0].rem + " -> returning")
        sql = `UPDATE bestellung SET bezahlt=${orders[0].bezahlt + remaining} WHERE id = ${orders[0].id};`;
        db.query(sql, function (err, orders) { if (err) throw err; });
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
      }
      // Allen Produkten ihre Zutaten zuteilen. Keine bessere Idee, aber die listen sind eh ned so groß
      for (var p = 0; p < prods.length; p++) {
        for (var z = 0; z < zutaten.length; z++) {
          if (zutaten[z].id_gericht == prods[p].id) {
            if (prods[p].zutaten) {
              prods[p].zutaten.push(zutaten[z]);
            } else {
              prods[p].zutaten = [];
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
      if(isNaN(d)){
        d=0;
      }
      
      res.render("table/productlist_new", { products: prods, currentWaitTime: d.toFixed(0) });
    });
    });
  });
});


module.exports = router;
