"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = require("crypto");
const router = express_1.default.Router();
const accountRepository = data_source_1.AppDataSource.getRepository(Account_1.Account);
/* GET list accounttypes */
router.get("/accounttypes", async (_req, res) => {
    res.json(Account_1.AccountType);
});
/* GET user account */
router.get("/account/:id", (0, express_validator_1.param)("id").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const user = await accountRepository.findOneBy({
        id: parseInt(req.params.id),
    });
    if (user == null) {
        res.sendStatus(404);
    }
    else {
        res.json(user);
    }
});
/* PUT user account */
router.get("/account", (0, express_validator_1.body)("username").isAlphanumeric(), (0, express_validator_1.body)("password").isString(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    let a = new Account_1.Account();
    a.name = req.body.username;
    // Hash password
    a.hash = (0, crypto_1.createHash)('sha256').update(req.body.password).digest('hex');
    a.accounttype = req.body.accounttype;
    // Save new account
    accountRepository.save(a).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
