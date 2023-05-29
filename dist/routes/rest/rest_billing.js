"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PaymentMethod_1 = require("./../../entity/PaymentMethod");
const database_1 = require("../../database");
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Session_1 = require("../../entity/Session");
const Order_1 = require("../../entity/Order");
const Bill_1 = require("../../entity/Bill");
/* Check session and accounttype*/
// Every active session needs full access
/* Check session and accounttype only USER */
router.use(function (req, res, next) {
    if (req.session.account &&
        req.session.account.accounttype == Account_1.AccountType.USER) {
        next();
    }
    else {
        console.log("rest/bill/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* GET bill overview screen */
router.get("/:sid/closedbills", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/closedbills: Input validation failed");
        return;
    }
    try {
        let bills = await data_source_1.AppDataSource.getRepository(Bill_1.Bill).find({
            relations: {
                session: true,
                cashier: true,
                method: true,
                orders: {
                    product: true,
                    variation: true,
                },
            },
            where: {
                session: {
                    id: req.params.sid,
                },
            },
            order: {
                paymentTime: "DESC",
            },
        });
        res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        res.json(bills);
    }
    catch (e) {
        console.log("rest/billing/closedbills: " + e);
        res.sendStatus(500);
    }
    return;
});
/* GET all unpayed payable orders */
router.get("/:sid/unpayedOrdersGrouped", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/unpayedOrdersGrouped: Input validation failed");
        return;
    }
    //console.log("Starting billing of session " + req.params!.sid);
    // Check if session exists
    try {
        await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({
            id: req.params.sid,
        });
    }
    catch (e) {
        console.log("rest/billing/unpayedOrdersGrouped: Session not found " +
            req.params.sid);
    }
    // Get billable order
    let o = await database_1.db.getBillableOrders(req.params.sid);
    // Group orders to map
    let orderMap = new Map();
    // For each order try to sort into the map
    o.forEach((oe) => {
        // Check if the same product/variation combination exists already in the map
        let inserted = false;
        orderMap.forEach((value, key) => {
            //console.log(oe.product.id + " - " + key.product.id)
            //console.log(( oe.variation != null).valueOf() + " - " + (oe.variation != null).valueOf());
            // Check if same product
            if (key.product.id == oe.product.id) {
                // Check if either no variations or both the same
                if (oe.variation == null && key.variation == null) {
                    // no variations, same product ++
                    orderMap.set(key, value + 1);
                    inserted = true;
                }
                else if (oe.variation != null &&
                    key.variation != null &&
                    oe.variation.id == key.variation.id) {
                    // same variations, same product ++
                    orderMap.set(key, value + 1);
                    inserted = true;
                }
            }
        });
        if (!inserted) {
            orderMap.set(oe, 1);
        }
    });
    //console.log(orderMap);
    res.json(Array.from(orderMap, ([key, value]) => ({ key, value })));
});
/* GET all payable orders orders */
router.get("/:sid/billableOrders", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/unpayedOrdersGrouped: Input validation failed");
        return;
    }
    // Get billable order
    database_1.db.getBillableOrders(req.params.sid)
        .then((r) => res.json(r))
        .catch((err) => {
        console.log("rest/billing/billableOrders: " + err);
        res.sendStatus(500);
    });
});
/* GET if session has no open or unpayed orders */
router.get("/:sid/closeable", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/closeable: Input validation failed");
        return;
    }
    // Count all outstanding orders
    database_1.db.getOutstandingOrderCount(req.params.sid).then((ooc) => {
        database_1.db.getBillableOrders(req.params.sid).then((bo) => {
            res.json({
                closeable: ooc == 0 && bo.length == 0,
            });
        });
    });
});
/* PUT Pay orders from session and generate bill */
router.put("/:sid/pay", (0, express_validator_1.param)("sid").isInt(), (0, express_validator_1.body)("pmid").isInt(), (0, express_validator_1.body)("orderids"), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("rest/billing/pay: Input validation failed");
        return;
    }
    // Get all keys from the request
    let orderids = req.body.orderids;
    // Generate new bill
    let bill = new Bill_1.Bill();
    bill.orders = [];
    // Get all orders for the bill
    try {
        for (const oid of orderids) {
            // Load reference order
            let o = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneOrFail({
                relations: {
                    session: true,
                    product: true,
                    variation: true,
                },
                where: {
                    id: oid
                }
            });
            // If only one requested add to billOrders
            bill.orders.push(o);
        }
        // Get payment method
        let pm = await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).findOneByOrFail({ id: Number(req.body.pmid) });
        // Additional information
        bill.cashier = req.session.account;
        bill.method = pm;
        bill.session = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({ id: req.params.sid });
        bill.paymentTime = new Date();
        await data_source_1.AppDataSource.getRepository(Bill_1.Bill).save(bill);
        res.sendStatus(200);
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
        return;
    }
});
module.exports = router;
