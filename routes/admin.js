var express = require('express');
var router = express.Router();
var db = require("../database");

router.get('/', function (req, res) {

  db.query('SELECT * FROM account', function (err, rows) {
    if (err) {
      console.log("error");
    }
    res.render("admin/admin", { regActive: global.registrationActive, uptime: parseInt(process.uptime()), personal: rows });
  });

});


router.post('/', function (req, res, next) {
  // store all the user input data
  const body = req.body;

  if (body.registrationPersonal == "on") {
    global.registrationActive = true;
  } else {
    global.registrationActive = false;
  }

  res.redirect("/admin");  // redirect to user form page after inserting the data
});


router.get('/configuration', function (req, res) {

  db.query('SELECT * FROM stand', function (err, rows) {
    if (err) {
      console.log("error");
    }

    db.query('SELECT * FROM Zutat', function (err, opts) {
      if (err) {
        console.log("error");
      }

      db.query('SELECT * FROM Gericht', function (err, prod) {
        if (err) {
          console.log(err);
        }

        res.render("admin/admin_configuration", { stations: rows, options: opts, products: prod });
      });

    });

  });

});

router.post('/configuration', function (req, res) {

  const body = req.body;
  console.log(body)


  // Neue Station anlegen
  if (body.new_station) {
    var sql = `INSERT INTO stand VALUES (0,"${body.new_station}",NULL)`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record inserted');
    });
  }

  // Neue Zutat anlegen
  if (body.new_option) {
    var sql = `INSERT INTO Zutat VALUES (0,"${body.new_option}")`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record inserted');
    });
  }

  // Neues Produkt anlegen
  if (body.product_name) {
    var station = body.product_station;
    var name = body.product_name;
    var options = body.product_option;
    var defaults = body.product_option_standard;
    var deliverable = (body.product_deliverable == "on");
    var cost = body.product_cost;

    // Produkt eintrag anlegen
    var sql = `INSERT INTO Gericht VALUES (0,${station},"${name}",${cost},${deliverable})`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      // Get Gericht ID!
      if (options) {
        var sql = `SELECT id FROM Gericht WHERE id_stand=${station} AND name = "${name}" AND preis = ${cost} and lieferbar = ${deliverable}`;
        db.query(sql, function (err, result) {
          if (err) throw err;
          // Optionen speichern
          for (var i = 0; i < options.length; i++) {
            var optional = defaults.includes(options[i]);
            var sql = `INSERT INTO Gericht_Zutaten VALUES (0,${result[0].id},${options[i]},1,${optional})`;
            db.query(sql, function (err, result) {
              if (err) throw err;
            });
            console.log(sql);
          }
        });
      }
    });
    console.log(sql);
  }

  // Remove Produkt
  if (body.remove_product) {
    // Gericht_Zutaten entfernen
    var sql = `DELETE FROM Gericht_Zutaten WHERE id_gericht = ${body.remove_product}`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record  deleted');
    });
    // Gericht entfernen
    var sql = `DELETE FROM Gericht WHERE id = ${body.remove_product}`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log('record  deleted');
    });
  }


  res.redirect("/admin/configuration");

});


router.get('/orderdata', function (req, res) {
  res.render("admin/admin_orderdata");
});

router.get('/login_admin', function (req, res) {
  res.render("admin/login_admin");
});



module.exports = router;
