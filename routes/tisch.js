var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/tisch_neu', function (req, res) {
  if (req.session.personal_id) {
    // Lade Tischgruppen
    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }
      res.render("tisch/tisch_neu", { table_groups: groups });
    });
  } else {
    res.redirect("/personal/personal_overview");
  }
});


router.post('/tisch_neu', function (req, res) {
  const body = req.body;
  console.log(req.body)
  console.log(req.session.personal_id)
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
            var sql = `INSERT INTO Account_Sitzung VALUES (0,${req.session.personal_id},${result[0].id})`;
            db.query(sql, function (err, groups) {
              if (err) {
                console.log(err);
              } else {
                console.log("Session linked to account")
              }
            });
            res.redirect("/tisch/tisch_overview");

          } else {
            // Es gibt keine aktive Sitzung -> Neue Erstellen, hinzufügen und öffnen
            // Create new session
            var sql = `INSERT INTO Sitzung VALUES (0,NOW(),NULL,${body.table},NULL,${req.session.personal_id})`;
            db.query(sql, function (err, groups) {
              if (err) {
                console.log(err);
              } else {
                console.log("New session created")
              }
              // Get ID from new Session
              var sql = `SELECT * FROM Sitzung WHERE id_ersteller = ${req.session.personal_id} AND end IS NULL AND id_tisch = ${body.table}`;
              db.query(sql, function (err, result) {
                if (err) {
                  console.log(err);
                } else {
                  if (result.length != 1) {
                    console.log("Error in getting id from new sitzung")
                    console.log(result)
                  }
                  // Link Session to my account
                  var sql = `INSERT INTO Account_Sitzung VALUES (0,${req.session.personal_id},${result[0].id})`;
                  db.query(sql, function (err, groups) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("Session linked to account")
                    }
                    res.redirect("/tisch/tisch_overview");
                  });
                }
              });
            });
          }
        }
      });



    }

  } else {
    res.redirect("/personal/personal_overview");
  }
});


router.get('/tisch_overview', function (req, res) {
  if (req.session.personal_id) {
    res.render("tisch/tisch_overview");
  } else {
    res.redirect("/personal/personal_overview");
  }

});

router.post('/tisch_overview/:sid', function (req, res) {
  if (req.session.personal_id) {
    var sid = req.params.sid;

    if (req.body.cancelOrder) {
      // Cancel order
      var sql = `UPDATE bestellung  SET stoniert=true WHERE id=${req.body.cancelOrder}`;
      db.query(sql, function (err, orders) {
        if (err) throw err;
        console.log("order " + req.body.cancelOrder + " canceled")
        res.redirect("/tisch/tisch_overview/"+sid);
      });
    } else {
      res.redirect("/tisch/tisch_overview/"+sid);
    }
  } else {
    res.redirect("/personal/personal_overview");
  }

});

router.get('/tisch_overview/:sid', function (req, res) {
  console.log("requestesd session overview: " + req.params.sid)
  if (req.session.personal_id) {
    var sql = `SELECT * FROM sitzung\
    INNER JOIN tisch\
    ON sitzung.id_tisch = tisch.id\
    WHERE sitzung.id = ${req.params.sid}`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      if (result[0]) {
        var sql = `SELECT bestellung.id AS id, bestellung.erstellt, bestellung.erledigt, bestellung.in_zubereitung,  bestellung.anzahl, bestellung.stoniert, gericht.name\
        FROM bestellung\
        INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
        WHERE bestellung.id_sitzung = ${req.params.sid}\
        ORDER BY bestellung.erstellt DESC`;
        db.query(sql, function (err, orders) {
          if (err) throw err;
          console.log(orders)
          if (orders.length == 0) {
            console.log("session " + req.params.sid + " no orders found")
          }
          res.render("tisch/tisch_overview", { t_name: result[0].nummer, orders: orders });
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



router.get('/tisch_kassieren', function (req, res) {
  if (req.session.personal_id) {
    res.render("tisch/tisch_kassieren");
  } else {
    res.redirect("/personal/personal_overview");
  }
});


module.exports = router;
