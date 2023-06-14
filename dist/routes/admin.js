"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Account_2 = require("../entity/Account");
const crypto_1 = require("crypto");
const multer_1 = __importDefault(require("multer"));
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
    res.render("admin/admin", {
        uptime: process.uptime() | 0,
        db_a: data_source_1.AppDataSource.isInitialized,
    });
});
router.post("/", async (req, res, _next) => {
    // store all the user input data
    const body = req.body;
    /* Logout admin session*/
    if (body.logout) {
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
    res.redirect("/admin"); // redirect to user form page after inserting the data
});
/* GET login page. */
router.get("/login", (req, res) => {
    if (req.session.account?.accounttype == Account_1.AccountType.ADMIN) {
        // Redirect tp mainpage if admin session exists
        res.redirect("/admin");
    }
    else {
        res.render("admin/admin_login", { err: false });
    }
});
/* POST login page */
router.post("/login", (0, express_validator_1.body)("username").isString().trim(), (0, express_validator_1.body)("password").isString().trim(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
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
    res.render("admin/admin_statistics_vue");
});
/* GET configuration page */
router.get("/configuration", async (req, res) => {
    res.render("admin/configuration/admin_configuration.ejs");
});
/* GET orderdata page */
router.get("/orderdata", async function (_req, res) {
    res.render("admin/admin_orderdata_vue");
});
/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/
module.exports = router;
