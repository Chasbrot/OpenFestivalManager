var express = require('express');
var router = express.Router();
var db = require("../database");
const fs = require('fs');
const { groupCollapsed } = require('console');
const { redirect } = require('express/lib/response');
var mysqldump = require('mysqldump');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

var crypto = require('crypto');
var hash = crypto.createHash('sha256');


router.get('/', function (req, res) {
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }

  db.query('SELECT * FROM account WHERE id_type=3', function (err, rows) {
    var db_access = true, db_table = true;
    if (err) {
      console.log(err);
      if (err.code != "ER_NO_SUCH_TABLE") {
        db_access = false;
      }
      db_table = false;
      rows = {};
    }
    res.render("admin/admin", { regActive: global.registrationActive, uptime: parseInt(process.uptime()), personal: rows, db_a: db_access, db_t: db_table });

  });

});


router.post('/', upload.single("dbfile"), function (req, res, next) {
  console.log(req.body)
  console.log(req.files)
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }
  // store all the user input data
  const body = req.body;

  if (body.registrationPersonal == "on") {
    global.registrationActive = true;
  } else {
    global.registrationActive = false;
  }

  if (body.createTables) {
    console.log("create Tables WIP");
    /*    fs.readFile('fm_db.sql', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      var sql = data.replaceAll("\n","");
      console.log(sql);
      
      db.query(sql, function (err, rows) {
        if (err) {
          console.log(err);
        }
      });
    });*/
  }

  /* Logout admin session*/
  if (req.body.logout) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err)
      } else {
        console.log("admin session destroyed")
      }
    });
    res.redirect("/admin/login");
    return;
  }

  /* Export database to sql file*/
  if (req.body.exportdb) {
    console.log("Exporting Database")
    mysqldump({
      connection: {
        host: 'localhost',
        user: 'root',
        password: 'Pa..w0rd',
        database: 'festivalmanager',
      },
      dumpToFile: './dump.sql',
      dumpToFile: './dump.sql'
    }).then(async () => {
      res.download("./dump.sql");
    }, () => { }).catch(err => {
      console.log(err)
    })
    return;
  }

  /* Export database to sql file*/
  if (req.body.resetDynamic) {
    console.log("Resetting Dynamic Data")
    db.clearDynamicData()
      .catch((err) => {
        console.log(err)
      }).finally(() => {
        res.redirect("/admin");
      })
    return;
  }

  /* Export database to sql file*/
  if (req.body.resetComplete) {
    console.log("Resetting All Data")
    /* Drop Database and reinitialize */
    clearDBStatic(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/admin");
      }
    });
  }

  /* Import db from uploaded sql file*/
  if (req.body.importdb) {
    console.log("Importing DB")
    var tmp_path = req.file.path;
    console.log(tmp_path)

    db.resetDBToSQLDump(req.file.path)
      .then((r) => {
        res.redirect("/admin");
      })
      .catch((err) => {
        console.log(err)
      });
    return;
  }

  /* Change Password */
  if (req.body.password1 && req.body.password2) {
    const b = req.body;
    console.log("Changing Password")
    // Vaildate Password rules
    if (b.password1.length >= 8 && b.password1) {
      const hash = crypto.createHash('sha256').update(b.password1).digest('hex');
      db.updateAccountPW(hash, req.session.admin_id)
        .then(() => {
          console.log("password changed")
          req.session.destroy((err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("admin session destroyed");
            }
            res.redirect("/admin/login");
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/admin");
        })
    }
    return;
  }


  res.redirect("/admin");  // redirect to user form page after inserting the data
});


router.get('/configuration', function (req, res) {
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }
  db.query('SELECT * FROM Tisch', function (err, table) {
    if (err) {
      console.log(err);
    }

    db.query('SELECT * FROM Tisch_Gruppe', function (err, groups) {
      if (err) {
        console.log(err);
      }
      res.render("admin/admin_configuration", { table_groups: groups, tables: table });
    });
  });

});

router.post('/configuration', function (req, res) {
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }
  const body = req.body;
  console.log(body)
  var sql;

  // Neue Tisch Gruppe anlegen
  if (body.new_table_group) {
    db.createTableGroup(body.new_table_group)
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        console.log('admin/config: table group record inserted');
      })
  }

  // Neuen Tisch anlegen
  if (body.new_table && body.table_group_id) {
    db.createTable(body.new_table, body.table_group_id)
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        console.log('admin/config: table record inserted');
      })
  }

  // Neue Station anlegen
  if (body.new_station) {
    db.createStation(body.new_station)
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        console.log('admin/config: station record inserted');
      })
  }

  // Neue Zutat anlegen
  if (body.new_option) {
    db.createOption(body.new_option)
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        console.log('admin/config: option record inserted');
      })
  }

  // Neues Produkt anlegen
  if (body.product_name) {
    console.log(req.body)
    var station = body.product_station;
    var name = body.product_name;
    var options = body.product_option;
    var defaults = body.product_option_standard;
    var deliverable = (body.product_deliverable == "on");
    var cost = body.product_cost;
    var priority = body.product_priority;

    db.createProduct(station, name, deliverable, cost, priority, options, defaults)
      .catch((err) => {
        console.log(err)
      });
     
  }

  // Remove Produkt
  if (body.remove_product) {
    db.removeProduct(body.remove_product)
      .catch((err) => {
        console.log(err)
      })
  }

  // Remove Produkt
  if (body.remove_option) {
    db.removeOption(body.remove_option)
      .catch((err) => {
        console.log(err)
      })
  }

  // Remove Tisch
  if (body.remove_table) {
    db.removeTable(remove_table)
      .catch((err) => {
        console.log(err)
      })
  }

  // Remove Tisch Gruppe
  if (body.remove_table_group) {
    // Tische entfernen
    db.removeTableGroup(body, remove_table_group)
      .catch((err) => {
        console.log(err)
      })
  }

  // New alert type
  if (body.newAlertType) {
    db.createAlertType(body.newAlertType)
      .catch((err) => {
        console.log(err)
      })
  }

  // New alert type
  if (body.deleteAlertType) {
    db.removeAlertType(body.deleteAlertType)
      .catch((err) => {
        console.log(err)
      })
  }


  res.redirect("/admin/configuration");

});


router.get('/orderdata', function (req, res) {
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }
  // Count all tables
  db.query("SELECT id, groupname FROM tisch_gruppe", function (err, tables) {
    if (err) {
      console.log(err);
    }
    res.render("admin/admin_orderdata", { table_groups: tables });
  });
});

router.get('/statistics', (req, res) => {
  if (!req.session.admin_id) {
    res.redirect("/admin/login");
    return;
  }
  // Count all sessions today
  db.query('SELECT DISTINCT(DATE_FORMAT(erledigt,"%d.%m.%Y")) AS date, DATE_FORMAT(erledigt,"%Y-%m-%d") AS date_machine FROM bestellung WHERE erledigt IS NOT NULL', function (err, dates) {
    if (err) {
      console.log(err);
    }
    res.render("admin/admin_statistics", { dates: dates });
  });
});


router.get('/login', function (req, res) {
  res.render("admin/login_admin", { err: false });
});

router.post('/login', (req, res) => {
  // check username
  if (req.body.username && req.body.password) {
    const hash = crypto.createHash('sha256').update(req.body.password).digest('hex');
    var sql = `SELECT id,name FROM account WHERE name ="${req.body.username}" AND id_type= 1 AND pw="${hash}"`;
    db.query(sql, function (err, result) {
      if (err) {
        console.log(err);
        /* If database is not reachable login with default credentials*/
        if (req.body.username == "admin" && req.body.password == "admin") {
          req.session.admin_id = 0;
          req.session.admin_name = "admin";
          res.redirect("/admin");
        } else {
          res.render("admin/login_admin", { err: true });
        }
      } else {
        if (result[0]) {
          req.session.admin_id = result[0].id;
          req.session.admin_name = result[0].name;
          res.redirect("/admin");
        } else {
          res.render("admin/login_admin", { err: true });
        }
      }
    });
  } else {
    res.render("admin/login_admin", { err: true });
  }

});




/*
Remove all staticly defined data
Includes: Table_Groups, Tables, Accounts, Product, Station, Options and all Mappings . Resets all autoincrements to 1;
*/
function clearDBStatic(callback) {
  var sql = `BEGIN; \
  DELETE FROM Gericht WHERE id <> -1; \
  DELETE FROM Account WHERE id <> -1; \
  DELETE FROM Tisch WHERE id <> -1; \
  DELETE FROM Tisch_gruppe WHERE id <> -1; \
  DELETE FROM Gericht_Zutaten WHERE id <> -1; \
  DELETE FROM Zutat WHERE id <> -1; \
  DELETE FROM Stand WHERE id <> -1; \
  DELETE FROM Alert WHERE id <> -1 \
  DELETE FROM AlertType WHERE id <> -1 \
  ALTER TABLE Gericht AUTO_INCREMENT = 1; \
  ALTER TABLE Account AUTO_INCREMENT = 1; \
  ALTER TABLE Tisch_Sitzung AUTO_INCREMENT = 1; \
  ALTER TABLE Tisch_Gruppe AUTO_INCREMENT = 1; \
  ALTER TABLE Gericht_Zutaten AUTO_INCREMENT = 1; \
  ALTER TABLE Zutat AUTO_INCREMENT = 1; \
  ALTER TABLE Stand AUTO_INCREMENT = 1; \
  ALTER TABLE Alert AUTO_INCREMENT = 1; \
  ALTER TABLE AlertType AUTO_INCREMENT = 1; \
  COMMIT;`;
  db.query(sql, function (err, rows) {
    callback(err);
  });
}





module.exports = router;
