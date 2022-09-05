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
const Order_1 = require("../entity/Order");
const State_1 = require("../entity/State");
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
router.get("/login", function (_req, res) {
    res.render("station/login_station", { err: "" });
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
    req.session.account = new Account_2.Account();
    req.session.account.id = station.id;
    req.session.account.accounttype = Account_1.AccountType.STATION;
    res.redirect("/station/" + station.id);
});
/* GET order entry html part*/
router.get("/orderentry/:oid", (0, express_validator_1.param)("oid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("session/orderentry: Input validation failed");
        return;
    }
    let order, wt, rec;
    try {
        // Load session and error if null
        order = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneOrFail({
            relations: {
                session: {
                    table: true,
                },
                states: true,
                product: true,
                variation: true,
                orderedIngredients: true,
            },
            where: {
                id: req.params.oid,
            },
        });
    }
    catch (e) {
        console.log("station/overview: Error" + e);
        res.sendStatus(500);
        return;
    }
    rec =
        order.getCurrentState().created.getHours() +
            ":" +
            order.getCurrentState().created.getMinutes();
    let createdState = order.states.find((v) => {
        if (v.statetype == State_1.StateType.CREATED) {
            return v;
        }
    });
    wt = ((new Date().valueOf() - createdState.created.valueOf()) /
        60000).toFixed(0);
    // Difference map for ordered vs available ingredients
    let diffMap = await database_1.db.getOrderIngredientsDiffMap(order);
    res.render("station/orderentry", {
        order: order,
        waittime: wt,
        recieved: rec,
        special: order.note != "" || diffMap.size,
        ingredients: diffMap,
    });
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
    res.render("station/station_overview_vue", {
        station: station,
        pre_orders: [],
    });
});
/* GET station overview */
router.post("/:sid", async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
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
    try {
        if (body.oid) {
            let order = await database_1.db.getOrderFromId(body.oid);
            switch (body.change) {
                case "processingOrder":
                    await database_1.db.setOrderStatus(order, State_1.StateType.COOKING, req.session.account);
                    break;
                case "sendingOrder":
                    await database_1.db.setOrderStatus(order, State_1.StateType.DELIVERING, req.session.account);
                    break;
                case "deliveredOrder":
                    await database_1.db.setOrderStatus(order, State_1.StateType.FINISHED, req.session.account);
                    break;
                case "canceledOrder":
                    await database_1.db.setOrderStatus(order, State_1.StateType.CANCELED, req.session.account);
                    break;
                default:
                    res.sendStatus(404);
                    console.log("station/post: unkown data " + body);
                    return;
            }
        }
    }
    catch (e) {
        console.log("station/post: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
