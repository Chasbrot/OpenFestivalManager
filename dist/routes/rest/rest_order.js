"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./../../database");
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Order_1 = require("../../entity/Order");
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
        req.session.account.accounttype == Account_1.AccountType.USER) {
        next();
    }
    else {
        console.log("rest/order/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* POST order/state */
/* Creates new state entry for a order*/
router.post("/:oid/state", (0, express_validator_1.param)("oid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty() && !req.body.new) {
        res.sendStatus(400);
        return;
    }
    try {
        let order = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneByOrFail({
            id: Number(req.params.oid),
        });
        await database_1.db.setOrderStatus(order, req.body.new, req.session.account);
    }
    catch (e) {
        console.log("rest/order/state POST: " + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* GET order */
router.get("/:oid", (0, express_validator_1.param)("oid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Order_1.Order)
        .findOne({
        relations: {
            states: true,
            variation: true,
            bill: true,
            product: true,
        },
        where: {
            id: Number(req.params.oid),
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
module.exports = router;
