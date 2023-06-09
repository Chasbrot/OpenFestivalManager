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
const Station_1 = require("../entity/Station");
const router = express_1.default.Router();
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.url.includes("login")) {
        next();
    }
    else {
        if (req.session.account &&
            (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
                req.session.account.accounttype == Account_1.AccountType.STATION)) {
            next();
        }
        else {
            console.log("station/auth: unauthorized, redirecting to login");
            res.redirect("/station/login");
            return;
        }
    }
});
/* GET login page */
router.get("/login", function (req, res) {
    if (req.session.account?.accounttype == Account_1.AccountType.STATION) {
        // Redirect tp mainpage if station session exists
        res.redirect("/station/" + req.session.station.id);
    }
    else {
        res.render("station/login_station", { err: "" });
    }
});
/* Station login */
router.post("/login", (0, express_validator_1.body)("username").isAlphanumeric(), async function (req, res, _next) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.render("station/login_station", { err: "Wrong input" });
        return;
    }
    let station = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneBy({
        name: req.body.username,
    });
    if (station == undefined) {
        res.render("station/login_station", { err: "Cannot find station" });
        return;
    }
    // Check if station has an account
    let sa = await data_source_1.AppDataSource.getRepository(Account_2.Account).findOneBy({
        name: req.body.username,
        accounttype: Account_1.AccountType.STATION,
    });
    // if no account found create new one
    if (sa == null) {
        console.log("station/login_station/createStationUser Creating missing station user");
        sa = new Account_2.Account();
        sa.name = station.name;
        sa.accounttype = Account_1.AccountType.STATION;
        sa.responsiblefor = [];
        sa.responsiblefor.push(station);
        try {
            await data_source_1.AppDataSource.getRepository(Account_2.Account).insert(sa);
        }
        catch (err) {
            console.log("station/login_station/createStationUser " + err);
            res.render("station/login_station", { err: "Error creating user" });
            return;
        }
    }
    // Set session data
    req.session.station = station;
    req.session.account = sa;
    res.redirect("/station/" + station.id);
});
/* GET station overview */
router.get("/:sid", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("session/overview: Input validation failed");
        return;
    }
    let station, po;
    try {
        // Load session and error if null
        station = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneOrFail({
            where: {
                id: req.params.sid,
            },
        });
    }
    catch (e) {
        console.log("station/overview: Error" + e);
        res.render("/station/login", { err: "System Error" });
        return;
    }
    res.render("station/station_overview", {
        station: station,
        pre_orders: [],
    });
});
/* GET station overview */
router.post("/:sid", async function (req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        console.log("session/overview: Input validation failed");
        return;
    }
    const body = req.body;
    /* Logout session*/
    if (body.logout) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("station/logout: session destroyed");
            }
        });
        res.redirect("/station/login");
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
