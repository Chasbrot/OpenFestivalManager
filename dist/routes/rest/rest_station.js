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
const Station_1 = require("../../entity/Station");
const Session_1 = require("../../entity/Session");
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
        req.session.account.accounttype == Account_1.AccountType.STATION) {
        next();
    }
    else {
        console.log("rest/station/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* GET stations */
router.put("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Station_1.Station)
        .find()
        .then((result) => {
        res.json(result);
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
    data_source_1.AppDataSource.getRepository(Session_1.Session)
        .findOne({
        relations: {
            orders: true,
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
            res.json(result.orders);
        }
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
