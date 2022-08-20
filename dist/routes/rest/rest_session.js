"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Table_1 = require("../../entity/Table");
const Session_1 = require("../../entity/Session");
const State_1 = require("../../entity/State");
const typeorm_1 = require("typeorm");
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
        req.session.account.accounttype == Account_1.AccountType.USER) {
        next();
    }
    else {
        console.log("rest/session/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* PUT create new session on table */
router.put("/", async (req, res) => {
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
        console.log("table/new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({
        sid: s.id,
    });
});
/* GET sessions from table */
router.get("/:tid/sessions", (0, express_validator_1.param)("tid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Session_1.Session)
        .find({
        relations: {
            table: true,
            states: true
        },
        where: {
            table: {
                id: Number(req.params.tid),
            },
        },
    })
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
