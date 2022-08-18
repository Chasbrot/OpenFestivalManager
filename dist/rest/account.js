"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../data-source");
const AccountType_1 = require("../entity/AccountType");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const accountTypeRepository = data_source_1.AppDataSource.getRepository(AccountType_1.AccountType);
/* GET home page. */
router.get('/accounttype', async (_req, res) => {
    const allUsers = await accountTypeRepository.find();
    res.json(allUsers);
});
module.exports = router;
