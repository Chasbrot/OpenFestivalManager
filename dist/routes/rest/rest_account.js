"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = require("crypto");
const router = express_1.default.Router();
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
router.get("/", (req, res) => {
    data_source_1.AppDataSource.getRepository(Account_1.Account)
        .find({
        order: {
            id: "ASC",
        },
    })
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log("rest/accounts/GET: " + err);
        res.sendStatus(500);
    });
});
/* PUT create user account */
router.put("/", (0, express_validator_1.body)("name").isString().trim(), (0, express_validator_1.body)("password").isString().trim().isStrongPassword(), (0, express_validator_1.body)("accounttype").isInt(), (0, express_validator_1.body)("loginAllowed").isBoolean(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const body = req.body;
    let a = new Account_1.Account();
    a.name = req.body.name;
    // Hash password
    a.hash = (0, crypto_1.createHash)("sha256").update(body.password).digest("hex");
    a.accounttype = body.accounttype;
    a.loginAllowed = body.loginAllowed;
    // Save new account
    data_source_1.AppDataSource.getRepository(Account_1.Account)
        .save(a)
        .then(() => {
        res.sendStatus(200);
    })
        .catch((err) => {
        console.log("/rest/account/PUT Error " + err);
        res.sendStatus(500);
    });
});
/* GET user account*/
router.get("/:id", (0, express_validator_1.param)("id").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Account_1.Account)
        .findOneBy({
        id: parseInt(req.params.id),
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
        console.log("rest/account/GET :" + err);
        res.sendStatus(500);
    });
});
/* PUT update account */
router.put("/:aid", (0, express_validator_1.body)("name").isString(), (0, express_validator_1.body)("password"), (0, express_validator_1.body)("accounttype").isInt(), (0, express_validator_1.body)("loginAllowed").isBoolean(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    try {
        let a = await data_source_1.AppDataSource.getRepository(Account_1.Account).findOneByOrFail({
            id: Number(req.params.aid),
        });
        a.accounttype = body.accounttype;
        a.name = body.name;
        a.loginAllowed = body.loginAllowed;
        if (body.password) {
            a.hash = (0, crypto_1.createHash)("sha256").update(body.password).digest("hex");
        }
        await data_source_1.AppDataSource.getRepository(Account_1.Account).save(a);
    }
    catch (e) {
        console.log("rest/account/PUT update : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE user account*/
router.delete("/:aid", (0, express_validator_1.param)("aid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    console.log("delete user account request  " + req.params.aid);
    try {
        let a = await data_source_1.AppDataSource.getRepository(Account_1.Account).findOneByOrFail({
            id: Number(req.params.aid),
        });
        await data_source_1.AppDataSource.getRepository(Account_1.Account).remove(a);
    }
    catch (e) {
        console.log("rest/account/delete: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
