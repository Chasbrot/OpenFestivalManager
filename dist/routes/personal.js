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
const database_1 = require("../database");
const router = express_1.default.Router();
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.url.includes("login") || req.url.includes("registrierung")) {
        next();
    }
    else {
        if (req.session.account?.accounttype == Account_1.AccountType.ADMIN ||
            req.session.account?.accounttype == Account_1.AccountType.USER) {
            next();
        }
        else {
            console.log("personal/auth: unauthorized, redirecting to login");
            res.redirect("/personal/login");
            return;
        }
    }
});
/* GET login page */
router.get("/login", function (_req, res) {
    res.render("personal/login_personal", { err: false });
});
/* Personal login */
router.post("/login", (0, express_validator_1.body)("username").isAlphanumeric(), async function (req, res, _next) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.render("personal/login_personal", { err: true });
        return;
    }
    let user = await data_source_1.AppDataSource.getRepository(Account_2.Account).findOneBy({
        name: req.body.username,
        accounttype: Account_1.AccountType.USER,
    });
    if (user == undefined || !user.loginAllowed) {
        res.render("personal/login_personal", { err: true });
        return;
    }
    req.session.account = user;
    res.redirect("/personal/overview");
});
/* Personal Overview */
router.get("/overview", async function (req, res) {
    let activeSessions, inactiveSessions;
    try {
        // Get active sessions
        activeSessions = await database_1.db.getActiveSessionsFromAccount(req.session.account);
        inactiveSessions = await database_1.db.getInactiveSessionsFromAccount(req.session.account);
    }
    catch (e) {
        console.log("personal/overview: " + e);
        res.render("personal/personal_overview", {
            personal_name: "Error",
            act_sessions: activeSessions,
            past_sessions: inactiveSessions,
        });
        return;
    }
    res.render("personal/personal_overview", {
        personal_name: req.session.account.name,
        act_sessions: activeSessions,
        past_sessions: inactiveSessions,
    });
});
router.post("/overview", function (req, res) {
    // Logout request
    if (req.body.logout) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("session destroyed");
            }
        });
        res.redirect("/personal/login");
        return;
    }
    res.redirect("/personal/overview");
});
/* Personal Registration */
router.get("/registrierung", function (_req, res) {
    if (global.registrationActive) {
        res.render("personal/registrierung_personal", { err: false });
    }
    else {
        res.redirect("/personal/login");
    }
});
router.post("/registrierung", (0, express_validator_1.body)("username").isAlphanumeric(), async function (req, res, _next) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.render("personal/registrierung_personal", { err: true });
        return;
    }
    let a = new Account_2.Account();
    a.name = req.body.username;
    a.accounttype = Account_1.AccountType.USER;
    try {
        await data_source_1.AppDataSource.getRepository(Account_2.Account).save(a);
    }
    catch (e) {
        console.log("personal/register: " + e);
        res.render("personal/registrierung_personal", { err: true });
    }
    res.redirect("/personal/login");
});
module.exports = router;
