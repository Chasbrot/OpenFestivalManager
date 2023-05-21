"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/* GET home page. */
router.get('/', (_req, res) => {
    res.render('index', { registrationActive: global.registrationActive });
});
/* GET developer page. */
router.get('/dev', (_req, res) => {
    res.render('dev');
});
/* GET developer page. */
router.get('/public', (_req, res) => {
    res.render('public_stats');
});
/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/
module.exports = router;
