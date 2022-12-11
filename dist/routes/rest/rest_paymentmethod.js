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
const PaymentMethod_1 = require("../../entity/PaymentMethod");
/* GET paymentmethods */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod)
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
/* GET default paymentmethod */
router.get("/default", (_req, res) => {
    data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod)
        .findOneByOrFail({ default: true })
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
/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN) {
        next();
    }
    else {
        console.log("rest/paymentmethod/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* PUT create paymentmethod*/
router.put("/", (0, express_validator_1.body)("name").isString(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("create new paymentmethod request");
    console.log(body);
    // Create Payment Method
    try {
        let pm = new PaymentMethod_1.PaymentMethod();
        pm.name = body.name;
        await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).save(pm);
    }
    catch (e) {
        console.log("rest/paymentmethod/PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* PUT set default payment method*/
router.put("/default", (0, express_validator_1.body)("pmid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("create new paymentmethod request");
    console.log(body);
    // Create Payment Method
    try {
        let new_default = await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).findOneByOrFail({ id: body.pmid });
        let old_default = await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).findOneByOrFail({ default: true });
        old_default.default = false;
        new_default.default = true;
        await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).save(old_default);
        await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).save(new_default);
    }
    catch (e) {
        console.log("rest/paymentmethod/default PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE paymentmethod*/
router.delete("/:pmid", (0, express_validator_1.param)("pmid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    console.log("delete paymentmethod request " + req.params.pmid);
    // Create Payment Method
    try {
        let pm = await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).findOneOrFail({
            where: {
                id: Number(req.params.pmid),
            },
        });
        await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).remove(pm);
    }
    catch (e) {
        console.log("rest/paymentmethod/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
