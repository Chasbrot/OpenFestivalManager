"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../entity/Account");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.session.account &&
        (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
            req.session.account.accounttype == Account_1.AccountType.USER)) {
        next();
    }
    else {
        console.log("table/auth: unauthorized, redirecting to login");
        res.redirect("/personal/login");
    }
});
/* GET new session */
router.get("/", async function (_req, res) {
    res.render("webui/main");
});
module.exports = router;
