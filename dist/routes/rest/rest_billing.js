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
const Bill_1 = require("../../entity/Bill");
/* Check session and accounttype*/
// Every active session needs full access
/* Check session and accounttype only USER */
router.use(function (req, res, next) {
    if (req.session.account &&
        req.session.account.accounttype == Account_1.AccountType.USER) {
        next();
    }
    else {
        console.log("rest/bill/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* GET bill overview screen */
router.get("/:sid/closedbills", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/closedbills: Input validation failed");
        return;
    }
    try {
        let bills = await data_source_1.AppDataSource.getRepository(Bill_1.Bill).find({
            relations: {
                session: true,
                cashier: true,
                method: true,
                orders: {
                    product: true,
                    variation: true,
                },
            },
            where: {
                session: {
                    id: req.params.sid,
                },
            },
            order: {
                paymentTime: "DESC"
            }
        });
        res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        res.json(bills);
    }
    catch (e) {
        console.log("rest/billing/closedbills: " + e);
        res.sendStatus(500);
    }
    return;
});
module.exports = router;
