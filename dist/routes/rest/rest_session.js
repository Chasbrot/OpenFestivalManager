"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright Michael Selinger 2023
const database_1 = require("./../../database");
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Table_1 = require("../../entity/Table");
const Session_1 = require("../../entity/Session");
const Order_1 = require("../../entity/Order");
const State_1 = require("../../entity/State");
const typeorm_1 = require("typeorm");
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account &&
        (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
            req.session.account.accounttype == Account_1.AccountType.USER)) {
        next();
    }
    else {
        console.log("rest/session/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* PUT create new session on table */
router.put("/", (0, express_validator_1.body)("tid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty() || !req.session.account) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("new session request");
    console.log(body);
    // Get Table
    let t, s;
    try {
        t = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneOrFail({
            relations: {
                sessions: true,
            },
            where: {
                id: body.tid,
            },
        });
        //Check if table has a active session?
        s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOne({
            relations: {
                states: true,
                table: true,
                servers: true,
            },
            where: {
                table: {
                    id: t.id,
                },
                states: {
                    history: false,
                    statetype: (0, typeorm_1.Not)(State_1.StateType.CLOSED),
                },
            },
        });
        if (s == null) {
            // No active session -> create new session
            s = new Session_1.Session(t);
            s.servers = [];
            s.servers.push(req.session.account);
            let state = new State_1.State(State_1.StateType.CREATED, req.session.account);
            s.states = [];
            s.states.push(state);
            await data_source_1.AppDataSource.getRepository(State_1.State).save(state);
            await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
        }
        else {
            // Active session on this table -> link to account
            // Check if account is already linked
            if (!s.servers.some((e) => e.id == req.session.account.id)) {
                s.servers.push(req.session.account);
                console.log("[PUT]/rest/session/: linking user to session");
                await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
            }
        }
    }
    catch (e) {
        console.log("rest/session/new PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({
        sid: s.id,
    });
});
/* GET all global active sessions */
router.get("/active", async (req, res) => {
    try {
        let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).find({
            relations: {
                states: true,
            },
            where: {
                // Which are NOT closed
                states: {
                    history: false,
                    statetype: (0, typeorm_1.Not)(State_1.StateType.CLOSED),
                },
            },
        });
        res.json(s);
    }
    catch (e) {
        console.log("rest/session/active GET: " + e);
        res.sendStatus(500);
        return;
    }
});
/* GET all active sessions from a user */
router.get("/activeByUser", async (req, res) => {
    try {
        let as = await database_1.db.getActiveSessionsFromAccount(req.session.account);
        res.json(as);
    }
    catch (e) {
        console.log("rest/session/activeByUser GET: " + e);
        res.sendStatus(500);
        return;
    }
});
/* GET all inactive sessions from a user */
router.get("/inactiveByUser", async (req, res) => {
    try {
        let as = await database_1.db.getInactiveSessionsFromAccount(req.session.account);
        res.json(as);
    }
    catch (e) {
        console.log("rest/session/inactiveByUser GET: " + e);
        res.sendStatus(500);
        return;
    }
});
/* GET session */
router.get("/:sid", (0, express_validator_1.param)("sid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Session_1.Session)
        .findOneOrFail({
        relations: {
            table: true,
            states: {
                triggerer: true
            },
            servers: true,
        },
        where: {
            id: Number(req.params.sid),
        },
    })
        .then((result) => {
        if (result == null) {
            res.sendStatus(404);
        }
        else {
            res.json(result);
        }
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET orders from session */
router.get("/:sid/orders", (0, express_validator_1.param)("sid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Order_1.Order)
        .find({
        relations: {
            product: true,
            variation: true,
            states: true,
            session: true,
        },
        where: {
            session: {
                id: Number(req.params.sid),
            },
            states: {
                history: false,
                statetype: (0, typeorm_1.Not)(State_1.StateType.CANCELED),
            },
        },
        order: {
            states: {
                statetype: "ASC",
                created: "ASC",
            },
        },
    })
        .then((result) => {
        result.forEach((r) => {
            // Load current states to objects
            r.getCurrentState();
        });
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* PUT create order */
router.put("/:sid", (0, express_validator_1.param)("sid").isInt().exists(), (0, express_validator_1.body)("vid"), (0, express_validator_1.body)("pid").isInt().exists(), (0, express_validator_1.body)("note"), async (req, res) => {
    // Request must have a product id
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    try {
        let order = await database_1.db.createOrder(req.session.account.id, Number(req.params.sid), body.pid, body.note, body.options, body.vid);
        res.json({
            oid: order.id,
        });
    }
    catch (e) {
        console.log("rest/session/order PUT: " + e);
        res.sendStatus(500);
    }
});
/* POST move session to other table */
router.put("/:sid/move", (0, express_validator_1.param)("sid").isInt(), (0, express_validator_1.body)("targetTid").isInt(), async function (req, res) {
    const body = req.body;
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    console.log(body);
    try {
        let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneOrFail({
            relations: {
                table: true,
                states: true,
                bills: true,
                orders: true,
                servers: true,
            },
            where: {
                id: req.params.sid,
            },
        });
        let table = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneByOrFail({
            id: body.table,
        });
        // Get target session
        let target_session = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOne({
            relations: {
                table: true,
                states: true,
                bills: true,
                orders: true,
                servers: true,
            },
            where: {
                table: {
                    id: req.body.targetTid,
                },
                states: {
                    history: false,
                    statetype: State_1.StateType.CREATED,
                },
            },
        });
        // Check if target table has a active session
        if (target_session == null) {
            s.table = table;
            await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
            console.log("table/moveSession: Moved session " + s.id + " to table " + table.id);
            res.json(s.id);
        }
        else {
            // Copy everything to target session
            await database_1.db.mergeSession(s, target_session, req.session.account);
            console.log("table/moveSession: Merged session " +
                s.id +
                " with " +
                target_session.id);
            res.json(target_session.id);
        }
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});
/* GET orders from session */
router.post("/:sid/close", (0, express_validator_1.param)("sid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    try {
        // Check if session can be closed
        let sid = Number(req.params.sid);
        if ((await database_1.db.getBillableOrders(sid)).length == 0 && (await database_1.db.getOutstandingOrderCount(sid)) == 0) {
            // Session can be closed
            let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({ id: sid });
            await database_1.db.setSessionStatus(s, State_1.StateType.CLOSED, req.session.account);
            res.sendStatus(200);
        }
        else {
            res.sendStatus(403);
        }
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});
module.exports = router;
