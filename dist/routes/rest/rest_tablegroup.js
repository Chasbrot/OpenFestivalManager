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
const TableGroup_1 = require("../../entity/TableGroup");
/* GET all tablegroups */
router.get("/", (req, res) => {
    data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup)
        .find()
        .then((result) => {
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
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
