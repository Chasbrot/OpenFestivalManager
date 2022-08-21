"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PaymentMethod_1 = require("./../entity/PaymentMethod");
const Product_1 = require("./../entity/Product");
const Ingredient_1 = require("../entity/Ingredient");
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = require("crypto");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Category_1 = require("../entity/Category");
const AlertType_1 = require("../entity/AlertType");
const Variation_1 = require("../entity/Variation");
const Order_1 = require("../entity/Order");
const accountRepository = data_source_1.AppDataSource.getRepository(Account_1.Account);
/* Check if request has a valid session*/
router.use(function (req, res, next) {
    if (req.session.account != null) {
        next();
    }
    else {
        console.log("rest/auth: No vaild session detected");
        res.sendStatus(403);
    }
});
// Routers for extra rest files, load file
const restStationRouter = require('./rest/rest_station');
const restTableGroupRouter = require('./rest/rest_tablegroup');
const restTableRouter = require('./rest/rest_table');
const restSessionRouter = require('./rest/rest_session');
// Send for rest station to file, assign file
router.use('/station', restStationRouter);
router.use('/tablegroup', restTableGroupRouter);
router.use('/table', restTableRouter);
router.use('/session', restSessionRouter);
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
    a.hash = (0, crypto_1.createHash)("sha256").update(req.body.password).digest("hex");
    a.accounttype = req.body.accounttype;
    // Save new account
    accountRepository
        .save(a)
        .then(() => {
        res.sendStatus(200);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET server uptime */
router.get("/uptime", (_req, res) => {
    res.json(process_1.default.uptime());
});
/* GET options */
router.get("/options", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient)
        .find()
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET categories */
router.get("/categories", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Category_1.Category)
        .find()
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET alerttypes */
router.get("/alerttypes", (_req, res) => {
    data_source_1.AppDataSource.getRepository(AlertType_1.AlertType)
        .find()
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET variations by product */
router.get("/product/:pid/variations", (0, express_validator_1.param)("pid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Variation_1.Variation)
        .find({
        relations: {
            product: true,
        },
        where: {
            product: {
                id: Number(req.params.pid),
            },
        },
    })
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET product */
router.get("/product/:pid", (0, express_validator_1.param)("pid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Product_1.Product)
        .find({
        relations: {
            producer: true,
        },
        where: {
            id: Number(req.params.pid),
        },
    })
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET order */
router.get("/order/:oid", (0, express_validator_1.param)("oid").isInt(), (req, res) => {
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
/* GET paymentmethods */
router.get("/paymentmethod", (_req, res) => {
    data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod)
        .find()
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
