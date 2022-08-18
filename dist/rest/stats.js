"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const accountRepository = data_source_1.AppDataSource.getRepository(Account_1.Account);
/* GET server uptime */
router.get("/uptime", (_req, res) => {
    res.send(process_1.default.uptime());
});
module.exports = router;
