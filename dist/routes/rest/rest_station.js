"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./../../database");
const Product_1 = require("../../entity/Product");
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Station_1 = require("../../entity/Station");
/* Check session and accounttype*/
router.use(function (req, res, next) {
    if (req.url.includes("login")) {
        next();
    }
    else {
        if (req.session.account.accounttype == Account_1.AccountType.ADMIN ||
            req.session.account.accounttype == Account_1.AccountType.STATION) {
            next();
        }
        else {
            console.log("rest/station/auth: unauthorized, redirecting to login");
            res.redirect("/station/login");
            return;
        }
    }
});
/* GET stations */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Station_1.Station)
        .find()
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET products by station */
router.get("/:sid/products", (0, express_validator_1.param)("sid").isInt(), (req, res) => {
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
            producer: {
                id: Number(req.params.sid),
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
/* GET active orders from station */
router.get("/:sid/activeorders", (0, express_validator_1.param)("sid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    database_1.db.getActiveOrdersForStation(Number(req.params.sid))
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET past orders from station */
router.get("/:sid/pastorders", (0, express_validator_1.param)("sid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    database_1.db.getPastOrdersForStation(Number(req.params.sid))
        .then((result) => {
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
module.exports = router;
