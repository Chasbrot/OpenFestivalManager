"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const AlertType_1 = require("../entity/AlertType");
const database_1 = require("../database");
/* Check if request has a valid session*/
router.use(function (req, res, next) {
    if (req.session.account != null) {
        next();
    }
    else {
        console.log("rest/auth: No vaild session detected");
        //res.sendStatus(403);
        res.redirect("/"); // For DEVELOPMENT
    }
});
// Routers for extra rest files, load file
const restStationRouter = require("./rest/rest_station");
const restTableGroupRouter = require("./rest/rest_tablegroup");
const restTableRouter = require("./rest/rest_table");
const restSessionRouter = require("./rest/rest_session");
const restOrderRouter = require("./rest/rest_order");
const restCategoryRouter = require("./rest/rest_category");
const restPaymentMethodRouter = require("./rest/rest_paymentmethod");
const restProductRouter = require("./rest/rest_product");
const restAlertTypeRouter = require("./rest/rest_alerttypes");
const restIngredientRouter = require("./rest/rest_ingredient");
const restVariationRouter = require("./rest/rest_variation");
const restAccountRouter = require("./rest/rest_account");
const restSystemRouter = require("./rest/rest_system");
// Send for rest station to file, assign file
router.use("/station", restStationRouter);
router.use("/tablegroup", restTableGroupRouter);
router.use("/table", restTableRouter);
router.use("/session", restSessionRouter);
router.use("/order", restOrderRouter);
router.use("/category", restCategoryRouter);
router.use("/paymentmethod", restPaymentMethodRouter);
router.use("/product", restProductRouter);
router.use("/alerttypes", restAlertTypeRouter);
router.use("/ingredient", restIngredientRouter);
router.use("/variation", restVariationRouter);
router.use("/account", restAccountRouter);
router.use("/system", restSystemRouter);
/* GET list accounttypes */
router.get("/accounttypes", async (_req, res) => {
    res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
    res.json(Account_1.AccountType);
});
/* GET server uptime */
router.get("/uptime", (_req, res) => {
    res.json(process_1.default.uptime());
});
/* POST create alert */
router.post("/alert/:aid", (0, express_validator_1.param)("aid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty() && !req.body.new) {
        res.sendStatus(400);
        return;
    }
    // Only stations are allowed
    if (req.session.account?.accounttype != Account_1.AccountType.STATION) {
        res.sendStatus(403);
        return;
    }
    // Validate Alert ID
    let alerttype = null;
    try {
        alerttype = await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).findOneByOrFail({
            id: Number(req.params.aid),
        });
    }
    catch (err) {
        console.log("rest/alert: POST create alert " + err);
        res.sendStatus(400);
        return;
    }
    await database_1.db.createAlert(alerttype, req.session.station);
    res.sendStatus(200);
});
/* GET registration active*/
router.get("/registrationactive", (_req, res) => {
    res.json({
        registrationactive: global.registrationActive,
    });
});
module.exports = router;
