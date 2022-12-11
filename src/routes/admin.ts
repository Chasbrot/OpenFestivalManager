import { PaymentMethod } from './../entity/PaymentMethod';
import { Category } from './../entity/Category';
import { TableGroup } from "../entity/TableGroup";
import { AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Account } from "../entity/Account";
import { createHash } from "crypto";
import mysqldump from "mysqldump";
import multer from "multer";
import { db }  from "../database";
import { Order } from "../entity/Order";
import { State } from "../entity/State";
import { Table } from "../entity/Table";
let upload = multer({ dest: "uploads/" });
const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (req.url.includes("login")) {
    next();
  } else {
    if (req.session.account && req.session.account!.accounttype == AccountType.ADMIN) {
      next();
    } else {
        console.log("admin/auth: unauthorized, redirecting to login")
      res.redirect("/admin/login");
      return;
    }
  }
});

/* GET main admin page */
router.get("/", async (_req: Request, res: Response) => {
  let users;
  let db_access = true;
  try {
    users = await AppDataSource.getRepository(Account).find({
      where: [{ accounttype: AccountType.USER }],
    });
  } catch (err) {
    console.log(err);
    db_access = false;
  }

  res.render("admin/admin", {
    uptime: process.uptime() | 0,
    db_a: db_access,
    regActive: global.registrationActive,
    personal: users,
  });
});

router.post("/", upload.single("dbfile"), async (req, res, _next) => {
  // store all the user input data
  const body = req.body;

  if (body.registrationPersonal == "on") {
    global.registrationActive = true;
  } else {
    global.registrationActive = false;
  }

  /* Logout admin session*/
  if (req.body.logout) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("admin/logout: session destroyed");
      }
    });
    res.redirect("/admin/login");
    return;
  }

  /* Export database to sql file*/
  if (req.body.exportdb) {
    console.log("Exporting Database");
    let time = new Date();
    let filename =
      "dump_" + time.getFullYear() + time.getMonth() + time.getDate();
    mysqldump({
      connection: {
        host: "localhost",
        user: "root",
        password: "Pa..w0rd",
        database: "festivalmanager",
      },
      dumpToFile: "./" + filename + ".sql",
    })
      .then(async () => {
        res.download("./" + filename + ".sql");
      })
      .catch((err) => {
        console.log("admin/sqldump: " + err);
      });
    return;
  }

  /* Export database to sql file*/
  if (req.body.resetDynamic) {
    console.log("Resetting Dynamic Data");
    res.sendStatus(501);
    return;
  }

  /* Export database to sql file*/
  if (req.body.resetComplete) {
    console.log("Resetting All Data");
    /* Drop Database and reinitialize */
    res.sendStatus(501);
    return;
  }

  /* Create new user */
  if (body.username && body.password && body.accounttype) {
    let user = new Account();
    user.name = body.username;
    user.hash = createHash("sha256").update(body.password).digest("hex");
    user.accounttype = body.accounttype;
    AppDataSource.getRepository(Account)
      .save(user)
      .then(() => {
        console.log("admin/createuser: User created, " + user.name);
      })
      .catch((err) => {
        console.log("admin/createuser: User creation failed" + err);
        console.log(user);
      });
  }

  /* Change Password */
  if (req.body.password1) {
    const b = req.body;
    console.log("Changing Password");
    if (req.session.account?.id == -1) {
      console.log("Cannot change built-in admin");
      res.redirect("/admin");
      return;
    }
    // Vaildate Password rules
    if (b.password1.length >= 8 && b.password1) {
      const hash = createHash("sha256").update(b.password1).digest("hex");
      let user = req.session.account;
      if (user == undefined) {
        console.log(
          "admin/pwchange: No User found for : " + req.session.account
        );
      } else {
        user.hash = hash;
        AppDataSource.getRepository(Account).save(user);
        console.log("admin/pwchange: Updated pw for user " + user.name);
      }
    } else {
      console.log("admin/pwchange: Passwords not the same or length match");
    }
  }

  res.redirect("/admin"); // redirect to user form page after inserting the data
});

/* GET login page. */
router.get("/login", (req: Request, res: Response) => {
  if (req.session.account?.accounttype == AccountType.ADMIN) {
    // Redirect tp mainpage if admin session exists
    res.redirect("/admin");
  } else {
    res.render("admin/admin_login", { err: false });
  }
});

/* POST login page */
router.post(
  "/login",
  body("username").isString(),
  body("password").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }

    // Check if there are admin users in the db
    const userCountQuery = AppDataSource.getRepository(Account)
      .createQueryBuilder("account")
      .where("account.accounttype = :at", { at: AccountType.ADMIN })
      .getCount();
    const count = await userCountQuery;

    // Default login if no admin user is present
    if (count == 0) {
      console.log(
        "No admin user found. Enabling INSECURE default access. Please add a user."
      );
      if (req.body.username == "admin" && req.body.password == "admin") {
        let a = new Account();
        a.accounttype = AccountType.ADMIN;
        a.id = -1;
        req.session.account=a;
        res.redirect("/admin");
        return;
      }
    }
    // Hash password
    const hash = createHash("sha256");
    hash.update(req.body.password);

    // Search for user
    const user = await AppDataSource.getRepository(Account).findOneBy({
      name: req.body.username,
      hash: hash.digest("hex"),
    });

    // User not found and check if user is allowed to login
    if (user == null || !user.loginAllowed) {
      res.render("admin/admin_login", { err: true });
      return;
    }

    // Save user data to session
    req.session.account=user;
    res.redirect("/admin");
  }
);

/* GET statistics page */
router.get("/statistics", async (_req, res) => {
  const dates = await AppDataSource.createQueryBuilder()
    .select("created")
    .from(State, "state")
    .distinct()
    .getMany();

  console.log(dates);
  throw Error("WIP");

  res.render("admin/admin_statistics", { dates: dates });
});

/* GET configuration page */
router.get("/configuration", async (req, res) => {
  res.render("admin/admin_configuration_vue.ejs");
});

/* POST configuration page */
router.post("/configuration", function (req, res) {
  const body = req.body;
  console.log(body);

  // Neue Tisch Gruppe anlegen
  if (body.new_table_group) {
    db.createTableGroup(body.new_table_group)
      .catch((err: Error) => {
        console.log(err);
      })
      .then(() => {
        console.log("admin/config: table group record inserted");
      });
  }

  // Neuen Tisch anlegen
  if (body.new_table && body.table_group_id) {
    db.createTable(body.new_table, body.table_group_id)
      .catch((err: Error) => {
        console.log(err);
      })
      .then(() => {
        console.log("admin/config: table record inserted");
      });
  }

  // Neue Station anlegen
  if (body.new_station) {
    db.createStation(body.new_station)
      .catch((err: Error) => {
        console.log(err);
      })
      .then(() => {
        console.log("admin/config: station record inserted");
      });
  }

  // Neue Zutat anlegen
  if (body.new_option) {
    db.createOption(body.new_option)
    .catch((err: Error) => {
      console.log(err);
    })
    .then(() => {
      console.log("admin/config: option record inserted");
    });
  }

  // Neue Zutat anlegen
  if (body.newPaymentMethod) {
    let pmm = new PaymentMethod();
    pmm.name = body.newPaymentMethod;
    AppDataSource.getRepository(PaymentMethod).save(pmm)
    .catch((err: Error) => {
      console.log(err);
    })
    .then(() => {
      console.log("admin/config: paymentmethod record inserted");
    });
  }

  // Neues Produkt anlegen
  if (body.product_name) {
    console.log(req.body);
    let station = Number(body.product_station);
    let name = body.product_name;
    let options = body.product_option;
    let defaults = body.product_option_standard;
    let deliverable = body.product_deliverable == "on";
    let cost = body.product_cost;
    let priority = Number(body.product_priority);
    let category = Number(body.product_category);

    db.createProduct(
      station,
      name,
      deliverable,
      cost,
      priority,
      options,
      defaults,
      category
    ).catch((err: Error) => {
      console.log(err);
    });
  }

  // Remove Produkt
  if (body.remove_product) {
    db.removeProduct(body.remove_product).catch((err: Error) => {
      console.log(err);
    });
  }

  // Remove Produkt
  if (body.remove_option) {
    db.removeIngredient(body.remove_option).catch((err: Error) => {
      console.log(err);
    });
  }

  // Remove Tisch
  if (body.remove_table) {
    db.removeTable(body.remove_table).catch((err: Error) => {
      console.log(err);
    });
  }

  // Remove Tisch Gruppe
  if (body.remove_table_group) {
    // Tische entfernen
    db.removeTableGroup(body.remove_table_group).catch((err: Error) => {
      console.log(err);
    });
  }

  // New alert type
  if (body.newAlertType) {
    db.createAlertType(body.newAlertType).catch((err: Error) => {
      console.log(err);
    });
  }

  // New alert type
  if (body.deleteAlertType) {
    db.removeAlertType(body.deleteAlertType).catch((err: Error) => {
      console.log(err);
    });
  }

  // New category
  if (body.newCategory) {
    let cat = new Category(body.newCategory);
    AppDataSource.getRepository(Category).save(cat).catch((err: Error) => {
      console.log(err);
    });
  }

  // Delete Category
  if (body.deleteCategory) {
    db.removeCategory(body.deleteCategory).catch((err: Error) => {
      console.log(err);
    });
  }

  // New category
  if (body.new_variation_product && body.new_variation_name) {
    db.createVariation(body.new_variation_name, body.new_variation_product, body.new_variation_price).catch((err: Error) => {
      console.log(err);
    });
  }

  res.redirect("/admin/configuration");
});

/* GET orderdata page */
router.get("/orderdata", async function (_req, res) {
  // Count all tables
  let tg = await AppDataSource.getRepository(TableGroup).find();
  res.render("admin/admin_orderdata", { table_groups: tg });
});

/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/

module.exports = router;
