"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PaymentMethod_1 = require("./../entity/PaymentMethod");
const Category_1 = require("./../entity/Category");
const TableGroup_1 = require("../entity/TableGroup");
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Account_2 = require("../entity/Account");
const crypto_1 = require("crypto");
const mysqldump_1 = __importDefault(require("mysqldump"));
const multer_1 = __importDefault(require("multer"));
const database_1 = require("../database");
const State_1 = require("../entity/State");
let upload = (0, multer_1.default)({ dest: "uploads/" });
const router = express_1.default.Router();
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.url.includes("login")) {
        next();
    }
    else {
        if (req.session.account && req.session.account.accounttype == Account_1.AccountType.ADMIN) {
            next();
        }
        else {
            console.log("admin/auth: unauthorized, redirecting to login");
            res.redirect("/admin/login");
            return;
        }
    }
});
/* GET main admin page */
router.get("/", async (_req, res) => {
    let users;
    let db_access = true;
    try {
        users = await data_source_1.AppDataSource.getRepository(Account_2.Account).find({
            where: [{ accounttype: Account_1.AccountType.USER }],
        });
    }
    catch (err) {
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
    }
    else {
        global.registrationActive = false;
    }
    /* Logout admin session*/
    if (req.body.logout) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            }
            else {
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
        let filename = "dump_" + time.getFullYear() + time.getMonth() + time.getDate();
        (0, mysqldump_1.default)({
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
        let user = new Account_2.Account();
        user.name = body.username;
        user.hash = (0, crypto_1.createHash)("sha256").update(body.password).digest("hex");
        user.accounttype = body.accounttype;
        data_source_1.AppDataSource.getRepository(Account_2.Account)
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
            const hash = (0, crypto_1.createHash)("sha256").update(b.password1).digest("hex");
            let user = req.session.account;
            if (user == undefined) {
                console.log("admin/pwchange: No User found for : " + req.session.account);
            }
            else {
                user.hash = hash;
                data_source_1.AppDataSource.getRepository(Account_2.Account).save(user);
                console.log("admin/pwchange: Updated pw for user " + user.name);
            }
        }
        else {
            console.log("admin/pwchange: Passwords not the same or length match");
        }
    }
    res.redirect("/admin"); // redirect to user form page after inserting the data
});
/* GET login page. */
router.get("/login", (_req, res) => {
    res.render("admin/admin_login", { err: false });
});
/* POST login page */
router.post("/login", (0, express_validator_1.body)("username").isString(), (0, express_validator_1.body)("password").isString(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    // Check if there are admin users in the db
    const userCountQuery = data_source_1.AppDataSource.getRepository(Account_2.Account)
        .createQueryBuilder("account")
        .where("account.accounttype = :at", { at: Account_1.AccountType.ADMIN })
        .getCount();
    const count = await userCountQuery;
    // Default login if no admin user is present
    if (count == 0) {
        console.log("No admin user found. Enabling INSECURE default access. Please add a user.");
        if (req.body.username == "admin" && req.body.password == "admin") {
            let a = new Account_2.Account();
            a.accounttype = Account_1.AccountType.ADMIN;
            a.id = -1;
            req.session.account = a;
            res.redirect("/admin");
            return;
        }
    }
    // Hash password
    const hash = (0, crypto_1.createHash)("sha256");
    hash.update(req.body.password);
    // Search for user
    const user = await data_source_1.AppDataSource.getRepository(Account_2.Account).findOneBy({
        name: req.body.username,
        hash: hash.digest("hex"),
    });
    // User not found and check if user is allowed to login
    if (user == null || !user.loginAllowed) {
        res.render("admin/admin_login", { err: true });
        return;
    }
    // Save user data to session
    req.session.account = user;
    res.redirect("/admin");
});
/* GET statistics page */
router.get("/statistics", async (_req, res) => {
    const dates = await data_source_1.AppDataSource.createQueryBuilder()
        .select("created")
        .from(State_1.State, "state")
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
        database_1.db.createTableGroup(body.new_table_group)
            .catch((err) => {
            console.log(err);
        })
            .then(() => {
            console.log("admin/config: table group record inserted");
        });
    }
    // Neuen Tisch anlegen
    if (body.new_table && body.table_group_id) {
        database_1.db.createTable(body.new_table, body.table_group_id)
            .catch((err) => {
            console.log(err);
        })
            .then(() => {
            console.log("admin/config: table record inserted");
        });
    }
    // Neue Station anlegen
    if (body.new_station) {
        database_1.db.createStation(body.new_station)
            .catch((err) => {
            console.log(err);
        })
            .then(() => {
            console.log("admin/config: station record inserted");
        });
    }
    // Neue Zutat anlegen
    if (body.new_option) {
        database_1.db.createOption(body.new_option)
            .catch((err) => {
            console.log(err);
        })
            .then(() => {
            console.log("admin/config: option record inserted");
        });
    }
    // Neue Zutat anlegen
    if (body.newPaymentMethod) {
        let pmm = new PaymentMethod_1.PaymentMethod();
        pmm.name = body.newPaymentMethod;
        data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).save(pmm)
            .catch((err) => {
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
        database_1.db.createProduct(station, name, deliverable, cost, priority, options, defaults, category).catch((err) => {
            console.log(err);
        });
    }
    // Remove Produkt
    if (body.remove_product) {
        database_1.db.removeProduct(body.remove_product).catch((err) => {
            console.log(err);
        });
    }
    // Remove Produkt
    if (body.remove_option) {
        database_1.db.removeIngredient(body.remove_option).catch((err) => {
            console.log(err);
        });
    }
    // Remove Tisch
    if (body.remove_table) {
        database_1.db.removeTable(body.remove_table).catch((err) => {
            console.log(err);
        });
    }
    // Remove Tisch Gruppe
    if (body.remove_table_group) {
        // Tische entfernen
        database_1.db.removeTableGroup(body.remove_table_group).catch((err) => {
            console.log(err);
        });
    }
    // New alert type
    if (body.newAlertType) {
        database_1.db.createAlertType(body.newAlertType).catch((err) => {
            console.log(err);
        });
    }
    // New alert type
    if (body.deleteAlertType) {
        database_1.db.removeAlertType(body.deleteAlertType).catch((err) => {
            console.log(err);
        });
    }
    // New category
    if (body.newCategory) {
        let cat = new Category_1.Category(body.newCategory);
        data_source_1.AppDataSource.getRepository(Category_1.Category).save(cat).catch((err) => {
            console.log(err);
        });
    }
    // Delete Category
    if (body.deleteCategory) {
        database_1.db.removeCategory(body.deleteCategory).catch((err) => {
            console.log(err);
        });
    }
    // New category
    if (body.new_variation_product && body.new_variation_name) {
        database_1.db.createVariation(body.new_variation_name, body.new_variation_product, body.new_variation_price).catch((err) => {
            console.log(err);
        });
    }
    res.redirect("/admin/configuration");
});
/* GET orderdata page */
router.get("/orderdata", async function (_req, res) {
    // Count all tables
    let tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).find();
    res.render("admin/admin_orderdata", { table_groups: tg });
});
/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/
module.exports = router;
