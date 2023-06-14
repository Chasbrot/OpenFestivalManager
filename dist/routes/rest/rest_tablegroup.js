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
const process_1 = __importDefault(require("process"));
const Table_1 = require("../../entity/Table");
const TableGroup_1 = require("../../entity/TableGroup");
/* GET all tablegroups */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup)
        .find({
        relations: {
            tables: true
        }
    })
        .then((result) => {
        if (_req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET tables from tablegroup */
router.get("/:tgid/tables", (0, express_validator_1.param)("tgid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Table_1.Table)
        .find({
        relations: {
            tablegroup: true,
        },
        where: {
            tablegroup: {
                id: Number(req.params.tgid),
            },
        },
    })
        .then((result) => {
        if (req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
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
/* PUT create ingredient*/
router.put("/", (0, express_validator_1.body)("name").isString(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("create new tablegroup request");
    console.log(body);
    // Create PC
    try {
        let tmp = new TableGroup_1.TableGroup(body.name);
        await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).save(tmp);
    }
    catch (e) {
        console.log("rest/tablegroup/PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE tablegroup*/
router.delete("/:tgid", (0, express_validator_1.param)("tgid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete tablegroup request " + req.params.tgid);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).findOneOrFail({
            where: {
                id: Number(req.params.tgid),
            },
        });
        await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).remove(tmp);
    }
    catch (e) {
        console.log("rest/tablegroup/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
