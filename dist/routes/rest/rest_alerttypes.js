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
const AlertType_1 = require("../../entity/AlertType");
/* GET alerttypes */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(AlertType_1.AlertType)
        .find()
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
/* PUT create alerttype*/
router.put("/", async (req, res) => {
    const body = req.body;
    console.log("create new alerttype request");
    console.log(body);
    // Check content
    if (!body.name) {
        res.sendStatus(400);
        return;
    }
    // Create AlertType
    try {
        let at = new AlertType_1.AlertType(body.name);
        await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).save(at);
    }
    catch (e) {
        console.log("rest/alerttype/PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE alerttype*/
router.delete("/:atid", (0, express_validator_1.param)("atid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete alerttype request");
    console.log(body);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).findOneOrFail({
            where: {
                id: Number(req.params.atid),
            },
        });
        await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).remove(tmp);
    }
    catch (e) {
        console.log("rest/alerttype/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
