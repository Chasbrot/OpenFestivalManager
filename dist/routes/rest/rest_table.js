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
const TableGroup_1 = require("../../entity/TableGroup");
/* GET all tables */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Table_1.Table)
        .find({})
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
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
            states: true,
            servers: true,
            bills: true,
            orders: true,
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
/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN) {
        next();
    }
    else {
        console.log("rest/table/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* PUT create new table */
router.put("/", (0, express_validator_1.body)("name").isString(), (0, express_validator_1.body)("tgid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty() && !req.body.pid) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("create new table request");
    console.log(body);
    // Create Table
    let tg;
    try {
        tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).findOneOrFail({
            relations: {
                tables: true,
            },
            where: {
                id: Number(body.tgid),
            },
        });
        let table = new Table_1.Table(body.name);
        tg.tables.push(table);
        await data_source_1.AppDataSource.getRepository(Table_1.Table).save(table);
        await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).save(tg);
    }
    catch (e) {
        console.log("table/new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE table*/
router.delete("/:tid", (0, express_validator_1.param)("tid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete table request " + req.params.tid);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneOrFail({
            where: {
                id: Number(req.params.tid),
            },
        });
        await data_source_1.AppDataSource.getRepository(Table_1.Table).remove(tmp);
    }
    catch (e) {
        console.log("rest/table/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
