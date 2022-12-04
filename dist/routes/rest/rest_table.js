"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Table_1 = require("../../entity/Table");
const Session_1 = require("../../entity/Session");
const TableGroup_1 = require("../../entity/TableGroup");
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
/* PUT create new session on table */
router.put("/", async (req, res) => {
    const body = req.body;
    console.log("create new table request");
    console.log(body);
    // Check content
    if (!body.name || !body.tgid) {
        res.sendStatus(400);
        return;
    }
    // Create Table
    let tg;
    try {
        tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).findOneOrFail({
            relations: {
                tables: true
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
module.exports = router;
