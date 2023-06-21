"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// Copyright Michael Selinger 2023
const Variation_1 = require("./entity/Variation");
const ProductIngredient_1 = require("./entity/ProductIngredient");
const Category_1 = require("./entity/Category");
const Session_1 = require("./entity/Session");
const Account_1 = require("./entity/Account");
const State_1 = require("./entity/State");
const Alert_1 = require("./entity/Alert");
const Product_1 = require("./entity/Product");
const Ingredient_1 = require("./entity/Ingredient");
const Station_1 = require("./entity/Station");
const Table_1 = require("./entity/Table");
const data_source_1 = require("./data-source");
const TableGroup_1 = require("./entity/TableGroup");
const AlertType_1 = require("./entity/AlertType");
const Order_1 = require("./entity/Order");
const typeorm_1 = require("typeorm");
class db {
    /**
     * Merges two sessions from source to target and deletes source
     * Moves all orders to target session
     * @param  {Session} source This session is merged to target and deleted
     * @param  {Session} target This session is the target of the merge
     * @return {Promise} Returns a promise with the result
     */
    static mergeSession(source, target, trigger) {
        return data_source_1.AppDataSource.transaction(async (transactionManager) => {
            // Merge Orders
            source.orders.forEach((o) => {
                o.session = target;
                transactionManager.save(o);
            });
            // Merge Bills
            source.bills.forEach((b) => {
                b.session = target;
                transactionManager.save(b);
            });
            // Merge servers if necessery
            source.servers.forEach((s) => {
                if (!target.servers.some((ss) => {
                    return ss.id == s.id;
                })) {
                    target.servers.push(s);
                    transactionManager.save(target.servers);
                }
            });
            await db.setSessionStatus(source, State_1.StateType.CLOSED, trigger);
        });
    }
    /**
     * Get all orders from a session where billing is possible
     * @param  {Number} sessionId The session where to search
     * @return {Promise} Returns all billable orders
     */
    static async getBillableOrders(sid) {
        let o = await data_source_1.AppDataSource.getRepository(Order_1.Order).find({
            relations: {
                states: true,
                variation: true,
                product: true,
                session: true,
                bill: true,
            },
            where: {
                // Any orders from this session
                session: {
                    id: sid,
                },
                // Which are finished
                states: {
                    history: false,
                    statetype: State_1.StateType.FINISHED,
                },
                // And don't have any bill yet assigned
                bill: (0, typeorm_1.IsNull)() // Doesn't work -> open github issue with typeorm
            },
        });
        //console.log(o);
        // filter out where bill != null
        // scheiß typeorm
        let filteredOrders = [];
        o.forEach((o) => {
            if (o.bill == null) {
                filteredOrders.push(o);
            }
        });
        o = filteredOrders;
        return o;
    }
    static async getOutstandingOrderCount(sid) {
        let openOrders = await data_source_1.AppDataSource.getRepository(Order_1.Order).find({
            relations: {
                states: true,
                bill: true,
                session: true,
            },
            where: [
                {
                    session: {
                        id: sid,
                    },
                },
            ],
        });
        let countOpenOrders = 0;
        // Filter all open orders and count them
        // scheiß typeorm
        openOrders.forEach((oo) => {
            if (oo.bill == null && oo.getCurrentState()?.statetype != State_1.StateType.FINISHED && oo.getCurrentState()?.statetype != State_1.StateType.CANCELED) {
                countOpenOrders += 1;
            }
        });
        return countOpenOrders;
    }
    /**
     * Creates a new session on table and map it to account
     * @param  {Number} sessionId The session which is added to the account
     * @param  {Number} accountId The account
     * @return {Promise} Returns a promise newly create session id
     */
    static createSession(tableId, accountId) {
        return new Promise(async (resolve, reject) => {
            let t;
            let a;
            try {
                t = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOneByOrFail({
                    id: tableId,
                });
                a = await data_source_1.AppDataSource.getRepository(Account_1.Account).findOneByOrFail({
                    id: accountId,
                });
            }
            catch (e) {
                return reject("db/createSession: e" + e);
            }
            let session = new Session_1.Session(t);
            try {
                await data_source_1.AppDataSource.getRepository(Session_1.Session).save(session);
                await this.setSessionStatus(session, State_1.StateType.CREATED, a);
            }
            catch (e) {
                return reject("db/createSession: e" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Creates a new order from a product on a session. Links all options to this order
     * @param  {Number} sessionId The session where the order is created
     * @param  {Number} accountId The account which creates the order
     * @param  {Number} productId The product which is ordered
     * @param  {Number} productNumber The amount of product ordered
     * @param  {Number} orderNote Any note for the order
     * @param  {Number} options A list of optionIds which are ordered
     * @return {Promise} Returns a promise newly create session id
     */
    static createOrder(accountId, sessionId, productId, orderNote, options, variationId) {
        return new Promise(async (resolve, reject) => {
            let order = new Order_1.Order();
            if (orderNote != "") {
                order.note = orderNote;
            }
            try {
                // Check and get all objects
                let a = await data_source_1.AppDataSource.getRepository(Account_1.Account).findOneByOrFail({
                    id: accountId,
                });
                let s = await data_source_1.AppDataSource.getRepository(Session_1.Session).findOneByOrFail({
                    id: sessionId,
                });
                let p = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({
                    id: productId,
                });
                if (variationId != undefined) {
                    let v = await data_source_1.AppDataSource.getRepository(Variation_1.Variation).findOneByOrFail({
                        id: variationId,
                    });
                    order.variation = v;
                }
                order.orderedBy = a;
                order.product = p;
                order.session = s;
                console.log(order);
                await data_source_1.AppDataSource.getRepository(Order_1.Order).save(order);
                // Create first initial state and save
                let state = new State_1.State(State_1.StateType.CREATED, a);
                state.order = order;
                state.triggerer = a;
                console.log(state);
                data_source_1.AppDataSource.getRepository(State_1.State).save(state);
                // Save all ordered options to the order
                if (options) {
                    order.orderedIngredients = [];
                    for (const element of options) {
                        let i = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneByOrFail({
                            id: element,
                        });
                        order.orderedIngredients.push(i);
                    }
                    await data_source_1.AppDataSource.getRepository(Order_1.Order).save(order);
                }
            }
            catch (e) {
                return reject("db/createOrder: Error " + e);
            }
            return resolve(order);
        });
    }
    /**
     * Creates a new product variation
     * @param  {Number} attrName Name of the attribute variation
     * @param  {Number} productId Id of the varied product
     * @param  {Number} price New price
     */
    static createVariation(attrName, productId, price) {
        return new Promise(async (resolve, reject) => {
            let v;
            try {
                let p = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({
                    id: productId,
                });
                v = new Variation_1.Variation(attrName, price, p);
                await data_source_1.AppDataSource.getRepository(Variation_1.Variation).save(v);
            }
            catch (e) {
                return reject("db/createVariation: " + e);
            }
            return resolve(v);
        });
    }
    /**
     * Update order status sent
     * @param  {Number} orderId The order to be updated
     * @return {Promise} Returns a promise
     */
    static setOrderStatus(order, status, _trigger) {
        return new Promise(async (resolve, reject) => {
            let n;
            try {
                console.log("new Status: " + status);
                let old = await this.getOrderStatus(order);
                console.log("old Status: " + old.statetype);
                if (old.statetype == status) {
                    return reject("db/setOrderStatus: Order has already state " + status);
                }
                old.history = true;
                n = new State_1.State(status, _trigger);
                n.order = order;
                console.log(old);
                console.log(n);
                console.log("saving updated old state");
                await data_source_1.AppDataSource.getRepository(State_1.State).save(old);
                console.log("saving new state");
                await data_source_1.AppDataSource.getRepository(State_1.State).save(n);
            }
            catch (e) {
                return reject("db/setOrderStatus: Failed to query" + e);
            }
            return resolve(n);
        });
    }
    /**
     * Set session state
     * @param  {Number} orderId The order to be updated
     * @return {Promise} Returns a promise
     */
    static setSessionStatus(s, status, trigger) {
        return new Promise(async (resolve, reject) => {
            let n;
            try {
                let old = await this.getSessionStatus(s);
                if (old.statetype == status) {
                    return reject("db/setSessionStatus: has already state " + status);
                }
                old.history = true;
                n = new State_1.State(status, trigger);
                n.session = s;
                await data_source_1.AppDataSource.getRepository(State_1.State).save(old);
                await data_source_1.AppDataSource.getRepository(State_1.State).save(n);
            }
            catch (e) {
                return reject("db/setSessionStatus: Failed to query" + e);
            }
            return resolve(n);
        });
    }
    /**
     * UGet current state of the order
     * @param  {Number} orderId The order to be updated
     * @return {Promise} Returns a promise
     */
    static getOrderStatus(o) {
        return new Promise(async (resolve, reject) => {
            let state;
            try {
                state = await data_source_1.AppDataSource.getRepository(State_1.State).findOne({
                    relations: {
                        order: true,
                    },
                    where: {
                        order: {
                            id: o.id,
                        },
                        history: false,
                    },
                });
                if (state == undefined) {
                    return reject("db/getOrderState: No state found for order " + o.id);
                }
            }
            catch (e) {
                return reject("db/getOrderState: Failed to query" + e);
            }
            return resolve(state);
        });
    }
    /**
     * Get order object from id
     * @param  {Number} orderId The order to be updated
     * @return {Promise} Returns a promise
     */
    static getOrderFromId(id) {
        return data_source_1.AppDataSource.getRepository(Order_1.Order).findOneByOrFail({
            id: id,
        });
    }
    /**
     * Get a difference map from a order between which ingredients are ordered and which are available
     * Returns Map<boolean,Ingredient> where the boolean indicates that an ingredient
     * should be added (true) or removed (false) from a product during this order
     * @param  {Number} orderId The order to be updated
     * @return {Promise} Returns a promise with the difference map
     */
    static async getOrderIngredientsDiffMap(o) {
        let orderedPI = o.orderedIngredients;
        let availPI = await data_source_1.AppDataSource.getRepository(ProductIngredient_1.ProductIngredient).find({
            where: {
                product: {
                    id: o.product.id,
                },
            },
        });
        // Generate difference map
        let diffMap = new Map();
        availPI.forEach((pi) => {
            if (pi.optional) {
                // Ingredient is optional
                if (!orderedPI.some((oi) => {
                    return oi.id == pi.ingredient.id;
                })) {
                    // Ingredient is ordered -> explizit add
                    diffMap.set(pi.ingredient, false);
                }
            }
            else {
                // Ingredient is default
                if (orderedPI.some((oi) => {
                    return oi.id == pi.ingredient.id;
                })) {
                    // Ingredient is not ordered -> explizit remove
                    diffMap.set(pi.ingredient, true);
                }
            }
        });
        return diffMap;
    }
    /**
     * UGet current state of the session
     * @param  {Session} The session
     * @return {Promise} Returns a promise
     */
    static getSessionStatus(s) {
        return new Promise(async (resolve, reject) => {
            let state;
            try {
                state = await data_source_1.AppDataSource.getRepository(State_1.State).findOne({
                    relations: {
                        order: true,
                    },
                    where: {
                        session: {
                            id: s.id,
                        },
                        history: false,
                    },
                });
                if (state == undefined) {
                    return reject("db/getSessionState: Not found " + s.id);
                }
            }
            catch (e) {
                return reject("db/getSessionState: Failed to query" + e);
            }
            return resolve(state);
        });
    }
    /**
     * Creates a new alert
     * @param  {Number} alerttypeId The type of alert made
     * @param  {Number} stationId The station which made the alert
     * @return {Promise} Returns a promise
     */
    static createAlert(at, s) {
        return new Promise(async (resolve, reject) => {
            let alert = new Alert_1.Alert(at, s);
            try {
                await data_source_1.AppDataSource.getRepository(Alert_1.Alert).save(alert);
            }
            catch (e) {
                return reject("db/createAlert: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Clear a new alert; Deactivates the alert
     * @param  {Number} alerttypeId The type of alert made
     * @param  {Number} stationId The station which made the alert
     * @return {Promise} Returns a promise
     */
    static clearAlert(alertId) {
        return new Promise(async (resolve, reject) => {
            try {
                let tmp = await data_source_1.AppDataSource.getRepository(Alert_1.Alert).findOne({
                    where: {
                        id: alertId,
                    },
                });
                if (tmp == undefined) {
                    return reject("db/removeAlertType: AlertType not found id: " + alertId);
                }
                tmp.active = false;
                await data_source_1.AppDataSource.getRepository(Alert_1.Alert).save(tmp);
            }
            catch (e) {
                return reject("db/clearAlert: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Creates a new alert type
     * @param  {String} alertTypeName
     * @return {Promise} Returns a promise
     */
    static createAlertType(alertTypeName) {
        return new Promise(async (resolve, reject) => {
            try {
                let at = new AlertType_1.AlertType(alertTypeName);
                await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).save(at);
            }
            catch (e) {
                return reject("db/createAlertType: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Remove a alert type
     * @param  {Number} alertTypeId
     * @return {Promise} Returns a promise
     */
    static removeAlertType(alertTypeId) {
        return new Promise(async (resolve, reject) => {
            try {
                let tmp = await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).findOne({
                    where: {
                        id: alertTypeId,
                    },
                });
                if (tmp == undefined) {
                    return reject("db/removeAlertType: AlertType not found id: " + alertTypeId);
                }
                await data_source_1.AppDataSource.getRepository(AlertType_1.AlertType).remove(tmp);
            }
            catch (e) {
                return reject("db/removeAlertType: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Returns all active orders for a specifc station
     * @param  {Number} stationId The station for which the orders are searched
     * @return {Promise} Returns a promise with a list of all orders;
     * b_id, wartezeit
     */
    static async getActiveOrdersForStation(sid) {
        return data_source_1.AppDataSource.getRepository(Order_1.Order).find({
            relations: {
                product: {
                    producer: true,
                    ingredients: true,
                },
                states: true,
                variation: true,
                orderedIngredients: true,
                session: {
                    table: true
                }
            },
            where: [
                {
                    // Orders with products from this station
                    product: {
                        producer: {
                            id: Number(sid),
                        },
                    },
                    // And order is not canceled or finished
                    states: [
                        {
                            history: false,
                            statetype: State_1.StateType.CREATED,
                        },
                        {
                            history: false,
                            statetype: State_1.StateType.COOKING,
                        },
                        {
                            history: false,
                            statetype: State_1.StateType.DELIVERING,
                        },
                    ],
                },
            ],
            order: {
                states: {
                    statetype: "DESC",
                    created: "ASC",
                },
            },
        });
    }
    /**
     * Returns all past orders for a specifc station
     * @param  {Number} stationId The station for which the orders are searched
     * @return {Promise} Returns a promise with a list of all orders;
     * b_id, g_name, order.closed, b AS b_anz, dauer, lieferzeit, t_nr, order.note,created
     */
    static async getPastOrdersForStation(stationId) {
        let dateRange = new Date();
        dateRange.setHours(dateRange.getHours() - 1);
        return data_source_1.AppDataSource.getRepository(Order_1.Order).find({
            relations: {
                product: {
                    producer: true,
                },
                states: true,
                variation: true,
                orderedIngredients: true,
                session: {
                    table: true
                },
                orderedBy: true
            },
            where: [
                {
                    // Orders with products from this station
                    product: {
                        producer: {
                            id: stationId,
                        },
                    },
                    // And order is canceled or finished
                    states: [
                        {
                            history: false,
                            statetype: State_1.StateType.FINISHED,
                            created: (0, typeorm_1.MoreThan)(dateRange),
                        },
                        {
                            history: false,
                            statetype: State_1.StateType.CANCELED,
                            created: (0, typeorm_1.MoreThan)(dateRange),
                        },
                    ],
                },
            ],
            order: {
                states: {
                    created: "DESC",
                },
            },
        });
    }
    /**
     * Clears all dynamic data from the database and registered personal exept admins and station users.
     * Includes: Orders, Sessions and mappings. Resets all autoincrements to 1;
     * @return {Promise} Returns a promise
     */
    static clearDynamicData() {
        return new Promise(async (resolve, reject) => {
            try {
                await data_source_1.AppDataSource.transaction(async (transactionalEntityManager) => {
                    transactionalEntityManager.getRepository(Order_1.Order).clear();
                    transactionalEntityManager.getRepository(State_1.State).clear();
                    transactionalEntityManager.getRepository(Session_1.Session).clear();
                    transactionalEntityManager.getRepository(Alert_1.Alert).clear();
                });
            }
            catch (e) {
                return reject("db/clearDynamicData: Create order failed" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Create new table group
     * @param  {String} groupName New table group name
     * @return {Promise} Returns a promise
     */
    static createTableGroup(groupName) {
        return new Promise(async (resolve, reject) => {
            let tg = new TableGroup_1.TableGroup(groupName);
            try {
                tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).save(tg);
            }
            catch (e) {
                return reject("db/createTableGroup: Failed to insert" + e);
            }
            return resolve(tg);
        });
    }
    /**
     * Create new table
     * @param  {String} tableName New table name
     * @param  {Number} tableGroupId Table Group of the new table
     * @return {Promise} Returns a promise
     */
    static createTable(tableName, tableGroupId) {
        return new Promise(async (resolve, reject) => {
            let table = new Table_1.Table(tableName);
            try {
                let tg = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).findOne({
                    where: {
                        id: tableGroupId,
                    },
                });
                console.log(tg);
                if (tg == undefined) {
                    return reject("db/createTable: TableGroup not found id:" + tableGroupId);
                }
                table.tablegroup = tg;
                table = await data_source_1.AppDataSource.getRepository(Table_1.Table).save(table);
            }
            catch (e) {
                return reject("db/createTable: Failed to insert" + e);
            }
            return resolve(table);
        });
    }
    /**
     * Create new station
     * @param  {String} stationName New station name
     * @return {Promise} Returns a promise
     */
    static createStation(stationName) {
        return new Promise(async (resolve, reject) => {
            let station = new Station_1.Station(stationName);
            try {
                station = await data_source_1.AppDataSource.getRepository(Station_1.Station).save(station);
            }
            catch (e) {
                return reject("db/createStation: Failed to insert" + e);
            }
            return resolve(station);
        });
    }
    /**
     * Create new ingredient
     * @param  {String} optionName New option name
     * @return {Promise} Returns a promise
     */
    static createOption(optionName) {
        return new Promise(async (resolve, reject) => {
            let option = new Ingredient_1.Ingredient(optionName);
            try {
                option = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).save(option);
            }
            catch (e) {
                return reject("db/createOption: Failed to query" + e);
            }
            return resolve(option);
        });
    }
    /**
     * Creates a new Product
     * @param  {Number} stationId The station where this product is made
     * @param  {String} productName The name of the product
     * @param  {Boolean} deliverable If the product gets delivered or need to be gathered
     * @param  {Number} cost Cost of a unit of product
     * @param  {Number} priority Priority of the order in the list
     * @param  {List} A list of option ids which available for this product
     * @param  {List} A list of option ids which are default for this product
     * @return {Promise} Returns a promise
     */
    static createProduct(stationId, productName, deliverable, cost, _priority, _options, _defaults, _category) {
        return new Promise(async (resolve, reject) => {
            let product = new Product_1.Product(productName, cost, deliverable);
            try {
                // Set additionall parameters
                product.list_priority = _priority;
                // Get and set station which produces this
                const s = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneByOrFail({
                    id: stationId,
                });
                product.producer = s;
                // Get Category
                const c = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneBy({
                    id: _category,
                });
                if (c != undefined) {
                    product.category = c;
                }
                // Save product
                try {
                    await data_source_1.AppDataSource.getRepository(Product_1.Product).save(product);
                }
                catch (err) {
                    return reject("db/createProduct: Save failed" + err);
                }
                // Get all defaults and option ingredients
                if (_defaults != undefined && _options != undefined) {
                    let d = [];
                    for (let i = 0; i < _defaults.length; i++) {
                        let t;
                        try {
                            t = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneByOrFail({
                                id: _defaults[i],
                            });
                        }
                        catch (err) {
                            return reject("db/createProduct: Ingredient not found, id " + i + err);
                        }
                        d.push(t);
                    }
                    // Get all optionals
                    let opt = _options.filter((e) => {
                        return !_defaults.includes(e);
                    });
                    let o = [];
                    for (let i = 0; i < opt.length; i++) {
                        let t;
                        try {
                            t = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneByOrFail({
                                id: opt[i],
                            });
                        }
                        catch (err) {
                            return reject("db/createProduct: Ingredient not found, id " + i + err);
                        }
                        o.push(t);
                    }
                    // Create Product -> Ingredient Links
                    let pi = [];
                    d.forEach((e) => {
                        console.log("default" + e);
                        pi.push(new ProductIngredient_1.ProductIngredient(product, e, false));
                    });
                    o.forEach((e) => {
                        console.log("optional" + e);
                        pi.push(new ProductIngredient_1.ProductIngredient(product, e, true));
                    });
                    // Save links
                    try {
                        for (const element of pi) {
                            await data_source_1.AppDataSource.getRepository(ProductIngredient_1.ProductIngredient).save(element);
                        }
                    }
                    catch (err) {
                        return reject("db/createProduct: Save product ingredient failed" + err);
                    }
                }
                console.log("db/createProduct: " + product.name + " created");
                return resolve(product);
            }
            catch (err) {
                return reject("db/createProduct: Query failed" + err);
            }
        });
    }
    /**
     * Removes a Product
     * @param  {Number} productId The product to be removed
     * @return {Promise} Returns a promise
     */
    static removeProduct(productId) {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOne({
                    where: {
                        id: productId,
                    },
                });
                if (product == undefined) {
                    return reject("db/removeProduct: Product not found id: " + productId);
                }
                await data_source_1.AppDataSource.getRepository(Product_1.Product).remove(product);
            }
            catch (e) {
                return reject("db/removeProduct: Remove failed" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Removes a Category
     * @param  {Number} categoryId The category to be removed
     * @return {Promise} Returns a promise
     */
    static removeCategory(categoryId) {
        return new Promise(async (resolve, reject) => {
            try {
                let tmp = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOne({
                    where: {
                        id: categoryId,
                    },
                });
                if (tmp == undefined) {
                    return reject("db/removeCategory: Not found id: " + categoryId);
                }
                await data_source_1.AppDataSource.getRepository(Category_1.Category).remove(tmp);
            }
            catch (e) {
                return reject("db/removeCategory: Remove failed" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Remove Table
     * @param  {Number} tableId Removes this table
     * @return {Promise} Returns a promise
     */
    static removeTable(tableId) {
        return new Promise(async (resolve, reject) => {
            try {
                let table = await data_source_1.AppDataSource.getRepository(Table_1.Table).findOne({
                    where: {
                        id: tableId,
                    },
                });
                if (table == undefined) {
                    return reject("db/removeTable: Table not found id: " + tableId);
                }
                await data_source_1.AppDataSource.getRepository(Table_1.Table).remove(table);
            }
            catch (e) {
                return reject("db/removeTable: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Remove Ingredient
     * @param  {Number} optionId
     * @return {Promise} Returns a promise
     */
    static removeIngredient(ingredientId) {
        return new Promise(async (resolve, reject) => {
            try {
                let ingredient = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOne({
                    where: {
                        id: ingredientId,
                    },
                });
                if (ingredient == undefined) {
                    return reject("db/removeIngredient: Ingredient not found id: " + ingredientId);
                }
                await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).remove(ingredient);
            }
            catch (e) {
                return reject("db/removeIngredient: Failed to query" + e);
            }
            return resolve(true);
        });
    }
    /**
     * Get active sessions for a account
     * @param  {Account} Account to search for
     */
    static getActiveSessionsFromAccount(a) {
        return data_source_1.AppDataSource.getRepository(Session_1.Session).find({
            relations: {
                table: true,
                states: true,
                servers: true,
            },
            where: [
                {
                    // Active State
                    states: {
                        history: false,
                        statetype: (0, typeorm_1.Not)(State_1.StateType.CLOSED),
                    },
                    // This account interacted with this session
                    servers: {
                        id: a.id,
                    },
                },
            ],
        });
    }
    /**
     * Get inactive sessions for a account
     * @param  {Account} Account to search for
     */
    static getInactiveSessionsFromAccount(a) {
        let dateRange = new Date();
        dateRange.setHours(dateRange.getHours() - 1);
        return data_source_1.AppDataSource.getRepository(Session_1.Session).find({
            relations: {
                table: true,
                states: true,
                servers: true,
            },
            where: [
                {
                    // Active State
                    states: {
                        history: false,
                        statetype: State_1.StateType.CLOSED,
                        created: (0, typeorm_1.MoreThan)(dateRange)
                    },
                    // This account interacted with this session
                    servers: {
                        id: a.id,
                    },
                },
            ],
            order: {
                states: {
                    created: "DESC"
                }
            }
        });
    }
    /**
     * Get all sold by a product
     * @param  {Product} product
     * @param  {Date} date
     * @return {Promise} Returns a promise
     */
    static getSoldByProduct(p, date) {
        return new Promise(async (resolve, reject) => {
            let c = data_source_1.AppDataSource.getRepository(Order_1.Order).count({
                relations: {
                    bill: true,
                    product: true,
                },
                where: {
                    bill: {
                        paymentTime: (0, typeorm_1.MoreThan)(date),
                    },
                    product: {
                        id: p.id,
                    },
                },
            });
            return resolve(c);
        });
    }
    /**
     * Removes a Table Group
     * @param  {Number} tableGroupId
     * @return {Promise} Returns a promise
     */
    static removeTableGroup(tableGroupId) {
        return new Promise(async (resolve, reject) => {
            try {
                let tmp = await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).findOne({
                    where: {
                        id: tableGroupId,
                    },
                });
                if (tmp == undefined) {
                    return reject("db/removeTableGroup: TableGroup not found id: " + tableGroupId);
                }
                await data_source_1.AppDataSource.getRepository(TableGroup_1.TableGroup).remove(tmp);
            }
            catch (e) {
                return reject("db/removeTableGroup: Remove query failed" + e);
            }
            return resolve(true);
        });
    }
}
exports.db = db;
