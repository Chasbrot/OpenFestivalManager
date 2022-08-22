"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Ingredient_1 = require("./../entity/Ingredient");
const Variation_1 = require("./../entity/Variation");
const Product_1 = require("./../entity/Product");
const Session_1 = require("./../entity/Session");
const Category_1 = require("./../entity/Category");
const TableGroup_1 = require("../entity/TableGroup");
const Account_1 = require("../entity/Account");
const data_source_1 = require("../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("../database");
const Order_1 = require("../entity/Order");
const State_1 = require("../entity/State");
const Table_1 = require("../entity/Table");
const Not_1 = require("typeorm/find-options/operator/Not");
const Station_1 = require("../entity/Station");
const typeorm_1 = require("typeorm");
const Bill_1 = require("../entity/Bill");
const PaymentMethod_1 = require("../entity/PaymentMethod");
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
router.get("/new", async function (_req, res) {
    let tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).find();
    res.render("table/table_new", { table_groups: tg });
});
/* POST new session */
router.post("/new", (0, express_validator_1.body)("table"), async function (req, res) {
    const body = req.body;
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.redirect("/table/new");
        return;
    }
    console.log("new session request");
    console.log(body);
    // Get Table
    let t, s;
    try {
        t = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneOrFail({
            relations: {
                sessions: true,
            },
            where: {
                id: body.table,
            },
        });
        //Check if table has a active session?
        s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOne({
            relations: {
                states: true,
                table: true,
                servers: true,
            },
            where: {
                table: {
                    id: t.id,
                },
                states: {
                    history: false,
                    statetype: (0, Not_1.Not)(State_1.StateType.CLOSED),
                },
            },
        });
        if (s == null) {
            // No active session -> create new session
            s = new Session_1.Session(t);
            s.servers = [];
            s.servers.push(req.session.account);
            let state = new State_1.State(State_1.StateType.CREATED, req.session.account);
            s.states = [];
            s.states.push(state);
            await data_source_1.AppDataSource.getRepository(State_1.State).save(state);
            await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
        }
        else {
            // Active session on this table -> link to account
            // Check if account is already linked
            if (!s.servers.some((e) => e.id == req.session.account.id)) {
                s.servers.push(req.session.account);
                console.log("linking user to session");
                await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
            }
        }
    }
    catch (e) {
        console.log("table/new: Error" + e);
        res.redirect("/table/new");
        return;
    }
    res.redirect("/table/" + s.id);
});
/* GET move session */
router.get("/:sid/move", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/overview: Input validation failed");
        return;
    }
    let tgs = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).find();
    res.render("table/table_move", {
        table_groups: tgs,
        session_id: req.params.sid,
    });
});
/* POST move session */
router.post("/:sid/move", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    const body = req.body;
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.redirect("/personal/overview");
        return;
    }
    console.log(body);
    try {
        let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneOrFail({
            relations: {
                table: true,
                states: true,
                bills: true,
                orders: true,
                servers: true,
            },
            where: {
                id: req.params.sid,
            },
        });
        let table = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneByOrFail({
            id: body.table,
        });
        // Get target session
        let target_session = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOne({
            relations: {
                table: true,
                states: true,
                bills: true,
                orders: true,
                servers: true,
            },
            where: {
                table: {
                    id: table.id,
                },
                states: {
                    history: false,
                    statetype: State_1.StateType.CREATED,
                },
            },
        });
        // Check if target table has a active session
        if (target_session == null) {
            s.table = table;
            await data_source_1.AppDataSource.getRepository(Session_1.Session).save(s);
            console.log("table/moveSession: Moved session " + s.id + " to table " + table.id);
        }
        else {
            // Copy everything to target session
            await database_1.db.mergeSession(s, target_session, req.session.account);
            console.log("table/moveSession: Merged session " +
                s.id +
                " with " +
                target_session.id);
        }
    }
    catch (e) {
        console.log(e);
        res.sendStatus(500);
        return;
    }
    res.redirect("/personal/overview");
});
/* GET bill overview screen */
router.get("/:sid/bills", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/overview: Input validation failed");
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
                    variation: true
                }
            },
            where: {
                session: {
                    id: req.params.sid
                }
            }
        });
        res.render("table/table_bills", {
            bills: bills,
        });
    }
    catch (e) {
        console.log("table/bills: " + e);
        res.redirect("/table/" + req.params.sid);
        return;
    }
});
/* GET billing screen */
router.get("/:sid/bill", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/overview: Input validation failed");
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
        console.log("table/bill: Session not found " + req.params.sid);
    }
    // Get billable order
    let o = await database_1.db.getBillableOrders(req.params.sid);
    // Count all outstanding orders
    let countOpenOrders = await database_1.db.getOutstandingOrderCount(req.params.sid);
    console.log(countOpenOrders);
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
                if ((oe.variation == null && key.variation == null)) {
                    // no variations, same product ++
                    orderMap.set(key, value + 1);
                    inserted = true;
                }
                else if (oe.variation != null && key.variation != null && oe.variation.id == key.variation.id) {
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
    res.render("table/table_bill", {
        session_id: req.params.sid,
        groupedOrders: orderMap,
        closeable: !countOpenOrders,
    });
});
/* POST billing screen */
router.post("/:sid/bill", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/overview: Input validation failed");
        return;
    }
    let body = req.body;
    console.log(body);
    if (body.payOrder && body.methodId) {
        // Get all keys from the request
        let keys = Object.keys(body);
        let refOrderIdMap = new Map();
        keys.forEach(element => {
            var x = parseInt(element);
            if (!isNaN(x) && body[x] != 0) {
                refOrderIdMap.set(x, body[x]);
            }
        });
        // Generate new bill
        let bill = new Bill_1.Bill();
        bill.orders = [];
        // Get all orders for the bill
        try {
            for (const [rOId, amount] of refOrderIdMap) {
                // Load reference order
                let o = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneOrFail({
                    relations: {
                        session: true,
                        product: true,
                        variation: true,
                    },
                    where: {
                        id: rOId
                    }
                });
                if (amount == 1) {
                    // If only one requested add to billOrders
                    bill.orders.push(o);
                }
                else {
                    // If more requested find x amount of similar orders
                    // Check if variation is present
                    let ords = [];
                    if (o.variation == null) {
                        // No variation
                        ords = await data_source_1.AppDataSource.getRepository(Order_1.Order).find({
                            relations: {
                                session: true,
                                product: true,
                            },
                            where: {
                                session: { id: o.session.id },
                                product: { id: o.product.id },
                                bill: (0, typeorm_1.IsNull)()
                            },
                            take: amount
                        });
                    }
                    else {
                        // Also check variation
                        ords = await data_source_1.AppDataSource.getRepository(Order_1.Order).find({
                            relations: {
                                session: true,
                                product: true,
                                variation: true,
                            },
                            where: {
                                session: { id: o.session.id },
                                product: { id: o.product.id },
                                variation: { id: o.variation.id },
                                bill: (0, typeorm_1.IsNull)()
                            },
                            take: amount
                        });
                    }
                    ords.forEach((e) => {
                        bill.orders.push(e);
                    });
                }
            }
            console.log(bill.orders);
            // Get payment method
            let pm = await data_source_1.AppDataSource.getRepository(PaymentMethod_1.PaymentMethod).findOneByOrFail({ id: body.methodId });
            // Additional information
            bill.cashier = req.session.account;
            bill.method = pm;
            bill.session = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({ id: req.params.sid });
            bill.paymentTime = new Date();
            await data_source_1.AppDataSource.getRepository(Bill_1.Bill).save(bill);
        }
        catch (e) {
            console.log(e);
            res.redirect("/table/" + req.params.sid + "/bill");
            return;
        }
    }
    else if (body.closeSession) {
        // Check if session can be closed
        if ((await database_1.db.getBillableOrders(req.params.sid)).length == 0 && (await database_1.db.getOutstandingOrderCount(req.params.sid)) == 0) {
            // Session can be closed
            let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({ id: req.params.sid });
            await database_1.db.setSessionStatus(s, State_1.StateType.CLOSED, req.session.account);
            res.redirect("/personal/overview");
            return;
        }
    }
    res.redirect("/table/" + req.params.sid + "/bill");
});
/* GET session overview */
router.get("/:sid", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/overview: Input validation failed");
        return;
    }
    let s, stations, orders;
    try {
        // Load session and error if null
        s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneOrFail({
            relations: {
                orders: {
                    product: true,
                    variation: true,
                    states: true,
                },
                table: true,
                states: true,
            },
            where: {
                id: req.params.sid,
            },
        });
        stations = await data_source_1.AppDataSource.getRepository(Station_1.Station).find();
        orders = await data_source_1.AppDataSource.getRepository(Order_1.Order).find({
            relations: {
                product: true,
                variation: true,
                states: true,
                session: true,
            },
            where: {
                session: {
                    id: s.id,
                },
                states: {
                    history: false,
                    statetype: (0, Not_1.Not)(State_1.StateType.CANCELED)
                }
            },
            order: {
                states: {
                    statetype: "ASC",
                    created: "ASC",
                },
            },
        });
        // Group Orders by Statetype if Canceled or Finished
        let groupedOrders = new Map();
        let singleOrders = [];
        orders.forEach((o) => {
            if (o.getCurrentState().statetype == State_1.StateType.FINISHED) {
                // State either canceled or finished
                // Check if map contains similar product/variation combination
                let found = false;
                try {
                    groupedOrders.forEach((v, k) => {
                        if (k[0].getCurrentState().statetype == o.getCurrentState().statetype) { // k[0].product.id == o.product.id && 
                            // Same product
                            /*if (k[0].variation != null && o.variation != null) {
                              if (k[0].variation.id == o.variation.id) {
                                // Has variation and same variation
                                found = true;
                                k.push(o);
                                groupedOrders.set(k, v + 1);
                                throw Error;
                              }
                            } else {*/
                            // Add product to existing, with no or different variation
                            found = true;
                            k.push(o);
                            groupedOrders.set(k, v + 1);
                            throw Error;
                            //}
                        }
                    });
                }
                catch (e) { }
                ;
                if (!found) {
                    // Save single order to array and map
                    // Add new product to map
                    let orderarray = [];
                    orderarray.push(o);
                    groupedOrders.set(orderarray, 1);
                }
            }
            else {
                // Save single order to array and map and never update since other state
                singleOrders.push(o);
            }
        });
        //console.log(groupedOrders);
        // Load all categories
        let cats = await data_source_1.AppDataSource.getRepository(Category_1.Category).find();
        let catUnknown = new Category_1.Category("?");
        catUnknown.id = -1;
        cats.push(catUnknown);
        res.render("table/table_overview", {
            t: s.table,
            singleOrders: singleOrders,
            groupedOrders: groupedOrders,
            stations: cats,
            sid: req.params.sid,
            closed: s.getCurrentState().statetype == State_1.StateType.CLOSED
        });
    }
    catch (e) {
        console.log("table/overview: Error" + e);
        res.redirect("/personal/overview");
        return;
    }
});
/* POST session overview */
router.post("/:sid", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    const body = req.body;
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.redirect("/table/overview");
        return;
    }
    console.log(body);
    // Order new product
    if (body.productid) {
        try {
            // Get product object
            let pr = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({
                id: req.body.productid,
            });
            // Get session object
            let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({
                id: req.params.sid,
            });
            // Create new order
            let o = new Order_1.Order();
            o.orderedBy = req.session.account;
            o.session = s;
            o.note = body.note;
            // Assign product
            o.product = pr;
            // Assign variation
            if (body.variationid) {
                let v = await data_source_1.AppDataSource.getRepository(Variation_1.Variation).findOneByOrFail({
                    id: Number(body.variationid),
                });
                o.variation = v;
            }
            // Assign Options
            if (body.option) {
                o.orderedIngredients = [];
                for (const element of body.option) {
                    let ingr = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneByOrFail({
                        id: Number(element),
                    });
                    o.orderedIngredients.push(ingr);
                }
            }
            // Create new state
            let state = new State_1.State(State_1.StateType.CREATED, req.session.account);
            await data_source_1.AppDataSource.getRepository(State_1.State).save(state);
            o.states = [];
            o.states.push(state);
            // Save order
            await data_source_1.AppDataSource.getRepository(Order_1.Order).save(o);
        }
        catch (e) {
            console.log("table/overview: Error" + e);
            res.redirect("/table/" + req.params.sid);
            return;
        }
    }
    // Finish order
    if (body.finishOrder) {
        try {
            let ord = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneByOrFail({
                id: req.body.finishOrder,
            });
            await database_1.db.setOrderStatus(ord, State_1.StateType.FINISHED, req.session.account);
        }
        catch (e) {
            console.log("table/overview/finishOrder: Error" + e);
            res.redirect("/table/" + req.params.sid);
            return;
        }
    }
    // Cancel order
    if (body.cancelOrder) {
        try {
            let ord = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneByOrFail({
                id: req.body.cancelOrder,
            });
            await database_1.db.setOrderStatus(ord, State_1.StateType.CANCELED, req.session.account);
        }
        catch (e) {
            console.log("table/overview/finishOrder: Error" + e);
            res.redirect("/table/" + req.params.sid);
            return;
        }
    }
    res.redirect("/table/" + req.params.sid);
});
/* GET product list for station */
router.get("/productlist/station/:sid", (0, express_validator_1.param)("sid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/productlist/station: Input validation failed");
        return;
    }
    let prods;
    try {
        prods = await data_source_1.AppDataSource.getRepository(Product_1.Product).find({
            relations: {
                producer: true,
                ingredients: true,
                variations: true,
            },
            where: {
                producer: {
                    id: req.params.sid,
                },
            },
            order: {
                list_priority: "DESC",
            },
        });
    }
    catch (e) {
        res.sendStatus(500);
        return;
    }
    res.render("table/productlist_new", {
        products: prods,
        currentWaitTime: 60,
        simpleProducts: [],
    });
});
/* GET product list for station */
router.get("/productlist/category/:cid", (0, express_validator_1.param)("cid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/productlist/category: Input validation failed");
        return;
    }
    let prods;
    try {
        if (req.params.cid == -1) {
            // Load products without a category
            prods = await data_source_1.AppDataSource.getRepository(Product_1.Product).find({
                relations: {
                    ingredients: true,
                    variations: true,
                    category: true,
                },
            });
            // Check auf null geht ned in typeorm -> bug auf github
            prods = prods.filter((p) => p.category == null);
        }
        else {
            prods = await data_source_1.AppDataSource.getRepository(Product_1.Product).find({
                relations: {
                    ingredients: true,
                    variations: true,
                    category: true,
                },
                where: {
                    category: {
                        id: req.params.cid,
                    },
                },
                order: {
                    list_priority: "DESC",
                },
            });
        }
    }
    catch (e) {
        res.sendStatus(500);
        return;
    }
    res.render("table/productlist_new", {
        products: prods,
        currentWaitTime: 60,
        simpleProducts: [],
    });
});
/* GET order details page */
router.get("/orderdetails/:oid", (0, express_validator_1.param)("oid").isInt(), async function (req, res) {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        console.log("table/orderdetails: Input validation failed");
        return;
    }
    let order;
    try {
        order = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneOrFail({
            relations: {
                states: {
                    triggerer: true,
                },
                orderedBy: true,
                product: {
                    producer: true,
                },
                variation: true,
                bill: {
                    cashier: true,
                    method: true,
                },
                orderedIngredients: true,
            },
            where: {
                id: Number(req.params.oid),
            },
            order: {
                states: {
                    created: "DESC",
                },
            },
        });
        //console.log(order);
    }
    catch (e) {
        res.sendStatus(500);
        return;
    }
    res.render("table/table_orderdetails", {
        o: order,
    });
});
module.exports = router;
