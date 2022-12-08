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
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account &&
        req.session.account.accounttype == Account_1.AccountType.ADMIN) {
        next();
    }
    else {
        console.log("rest/account/auth: unauthorized");
        res.sendStatus(401);
        return;
    }
});
/* GET all accounts */
router.get("/database/config", async (req, res) => {
    let dso = {
        connected: data_source_1.AppDataSource.isInitialized,
        host: process_1.default.env.DB_HOST,
        port: process_1.default.env.DB_PORT,
        user: process_1.default.env.DB_USER,
        password: "",
        dbname: process_1.default.env.DB_SCHEMA,
    };
    res.json(dso);
});
/* POST test accounts */
router.post("/database/test", (0, express_validator_1.body)("host").isString(), (0, express_validator_1.body)("port").isInt(), (0, express_validator_1.body)("user").isAlphanumeric(), (0, express_validator_1.body)("password").isString(), (0, express_validator_1.body)("dbname").isString(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        console.log((0, express_validator_1.validationResult)(req));
        res.sendStatus(400);
        return;
    }
    let body = req.body;
    if (await data_source_1.ds.createADS(body.host, body.port, body.user, body.password, body.dbname)) {
        res.json({ test_result: true });
    }
    else {
        if (!await data_source_1.ds.createADSFromFile()) {
            console.log("rest/system/database/test: Fallback to file failed! ");
            res.sendStatus(500);
        }
        res.json({ test_result: false });
    }
});
module.exports = router;
