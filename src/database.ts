import { Variation } from "./entity/Variation";
import { ProductIngredient } from "./entity/ProductIngredient";
import { Category } from "./entity/Category";
import { Session } from "./entity/Session";
import { Account } from "./entity/Account";
import { State, StateType } from "./entity/State";
import { Alert } from "./entity/Alert";
import { Product } from "./entity/Product";
import { Ingredient } from "./entity/Ingredient";
import { Station } from "./entity/Station";
import { Table } from "./entity/Table";
import { AppDataSource } from "./data-source";
import { TableGroup } from "./entity/TableGroup";
import { stat } from "fs/promises";
import { AlertType } from "./entity/AlertType";
import { Order } from "./entity/Order";
import { IsNull, LessThan, MoreThan, Not, OrderByCondition } from "typeorm";
import { truncate } from "fs";
import session from "express-session";

export class db {
  /**
   * Merges two sessions from source to target and deletes source
   * Moves all orders to target session
   * @param  {Session} source This session is merged to target and deleted
   * @param  {Session} target This session is the target of the merge
   * @return {Promise} Returns a promise with the result
   */
  static mergeSession(source: Session, target: Session, trigger: Account):Promise<void> {
    return AppDataSource.transaction(async (transactionManager) => {
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
        if(!target.servers.some((ss) => {
          return ss.id == s.id;
        })) {
          target.servers.push(s);
          transactionManager.save(target.servers);
        }
      });
      await db.setSessionStatus(source, StateType.CLOSED, trigger);
    });
  }

  /**
   * Get all orders from a session where billing is possible
   * @param  {Number} sessionId The session where to search
   * @return {Promise} Returns all billable orders
   */
  static async getBillableOrders(sid: number):Promise<Order[]> {
    let o = await AppDataSource.getRepository(Order).find({
      relations: {
        states: true,
        variation: true,
        product: true,
        session: true,
        bill: true,
      },
      where: 
        {
          // Any orders from this session
          session: {
            id: sid,
          },
          // Which are finished
          states: {
            history: false,
            statetype: StateType.FINISHED,
          },
          // And don't have any bill yet assigned
          bill: IsNull() // Doesn't work -> open github issue with typeorm
        },
    });
    //console.log(o);
    // filter out where bill != null
    // scheiß typeorm
    let filteredOrders:Order[] =[];
    o.forEach((o)=>{
      if(o.bill == null){
        filteredOrders.push(o);
      }
    });
    o=filteredOrders;
    return o;
  }

  static async getOutstandingOrderCount(sid: number):Promise<number>{
    let openOrders = await AppDataSource.getRepository(Order).find({
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
    let countOpenOrders=0;
    // Filter all open orders and count them
    // scheiß typeorm
    openOrders.forEach((oo)=>{
      if(oo.bill==null && oo.getCurrentState()?.statetype!=StateType.FINISHED && oo.getCurrentState()?.statetype!=StateType.CANCELED){
        countOpenOrders+=1;
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
  static createSession(tableId: number, accountId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let t;
      let a;
      try {
        t = await AppDataSource.getRepository(Table).findOneByOrFail({
          id: tableId,
        });
        a = await AppDataSource.getRepository(Account).findOneByOrFail({
          id: accountId,
        });
      } catch (e) {
        return reject("db/createSession: e" + e);
      }
      let session = new Session(t);
      try {
        await AppDataSource.getRepository(Session).save(session);
        await this.setSessionStatus(session, StateType.CREATED, a);
      } catch (e) {
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
  static createOrder(
    accountId: number,
    sessionId: number,
    productId: number,
    orderNote: string,
    options: number[],
    variationId: number
  ):Promise<Order> {
    return new Promise(async (resolve, reject) => {
      let order = new Order();
      if(orderNote != ""){
        order.note = orderNote;
      }
      try {
        // Check and get all objects
        let a = await AppDataSource.getRepository(Account).findOneByOrFail({
          id: accountId,
        });
        let s = await AppDataSource.getRepository(Session).findOneByOrFail({
          id: sessionId,
        });
        let p = await AppDataSource.getRepository(Product).findOneByOrFail({
          id: productId,
        });
        if (variationId != undefined) {
          let v = await AppDataSource.getRepository(Variation).findOneByOrFail({
            id: variationId,
          });
          order.variation = v;
        }
        order.orderedBy = a;
        order.product = p;
        order.session = s;
        await AppDataSource.getRepository(Order).save(order);
        // Create first initial state and save
        let state = new State(StateType.CREATED, a);
        state.order = order;
        AppDataSource.getRepository(State).save(state);
        // Save all ordered options to the order
        if (options) {
          order.orderedIngredients = [];
          for (const element of options) {
            let i = await AppDataSource.getRepository(Ingredient).findOneByOrFail(
              {
                id: element,
              }
            );
            order.orderedIngredients.push(i);
          }
          await AppDataSource.getRepository(Order).save(order);
        }

      } catch (e) {
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
  static createVariation(attrName: string, productId: number, price: number):Promise<Variation> {
    return new Promise(async (resolve, reject) => {
      
      let v;
      try {
        let p = await AppDataSource.getRepository(Product).findOneByOrFail({
          id: productId,
        });
        v = new Variation(attrName, price, p);
        await AppDataSource.getRepository(Variation).save(v);
      } catch (e) {
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
  static setOrderStatus(order: Order, status: StateType, _trigger: Account):Promise<State> {
    return new Promise<State>(async (resolve, reject) => {
      let n;
      try {
        let old: State = await this.getOrderStatus(order);
        if (old.statetype == status) {
          return reject("db/setOrderStatus: Order has already state " + status);
        }
        old.history = true;
        n = new State(status, _trigger);
        n.order = order;
        await AppDataSource.getRepository(State).save(old);
        await AppDataSource.getRepository(State).save(n);
      } catch (e) {
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
  static setSessionStatus(s: Session, status: StateType, trigger: Account):Promise<State> {
    return new Promise<State>(async (resolve, reject) => {
      let n;
      try {
        let old: State = await this.getSessionStatus(s);
        if (old.statetype == status) {
          return reject("db/setSessionStatus: has already state " + status);
        }
        old.history = true;
        n = new State(status, trigger);
        n.session = s;
        await AppDataSource.getRepository(State).save(old);
        await AppDataSource.getRepository(State).save(n);
      } catch (e) {
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
  static getOrderStatus(o: Order):Promise<State> {
    return new Promise<State>(async (resolve, reject) => {
      let state;
      try {
        state = await AppDataSource.getRepository(State).findOne({
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
      } catch (e) {
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
  static getOrderFromId(id: number):Promise<Order> {
    return AppDataSource.getRepository(Order).findOneByOrFail({
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
  static async getOrderIngredientsDiffMap(
    o: Order
  ): Promise<Map<Ingredient, boolean>> {
    let orderedPI = o.orderedIngredients;
    let availPI = await AppDataSource.getRepository(ProductIngredient).find({
      where: {
        product: {
          id: o.product.id,
        },
      },
    });
    // Generate difference map
    let diffMap = new Map<Ingredient, boolean>();
    availPI.forEach((pi) => {
      if (pi.optional) {
        // Ingredient is optional
        if (
          !orderedPI.some((oi) => {
            return oi.id == pi.ingredient.id;
          })
        ) {
          // Ingredient is ordered -> explizit add
          diffMap.set(pi.ingredient, false);
        }
      } else {
        // Ingredient is default
        if (
          orderedPI.some((oi) => {
            return oi.id == pi.ingredient.id;
          })
        ) {
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
  static getSessionStatus(s: Session):Promise<State> {
    return new Promise<State>(async (resolve, reject) => {
      let state;
      try {
        state = await AppDataSource.getRepository(State).findOne({
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
      } catch (e) {
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
  static createAlert(at: AlertType, s: Station):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let alert = new Alert(at, s);
      try {
        await AppDataSource.getRepository(Alert).save(alert);
      } catch (e) {
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
  static clearAlert(alertId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let tmp = await AppDataSource.getRepository(Alert).findOne({
          where: {
            id: alertId,
          },
        });
        if (tmp == undefined) {
          return reject(
            "db/removeAlertType: AlertType not found id: " + alertId
          );
        }
        tmp.active = false;
        await AppDataSource.getRepository(Alert).save(tmp);
      } catch (e) {
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
  static createAlertType(alertTypeName: string):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let at = new AlertType(alertTypeName);
        await AppDataSource.getRepository(AlertType).save(at);
      } catch (e) {
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
  static removeAlertType(alertTypeId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let tmp = await AppDataSource.getRepository(AlertType).findOne({
          where: {
            id: alertTypeId,
          },
        });
        if (tmp == undefined) {
          return reject(
            "db/removeAlertType: AlertType not found id: " + alertTypeId
          );
        }
        await AppDataSource.getRepository(AlertType).remove(tmp);
      } catch (e) {
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
  static async getActiveOrdersForStation(sid: number):Promise<Order[]> {
    return AppDataSource.getRepository(Order).find({
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
              statetype: StateType.CREATED,
            },
            {
              history: false,
              statetype: StateType.COOKING,
            },
            {
              history: false,
              statetype: StateType.DELIVERING,
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
  static async getPastOrdersForStation(stationId: number):Promise<Order[]> {
    let dateRange = new Date();
    dateRange.setHours(dateRange.getHours() - 1);
    return AppDataSource.getRepository(Order).find({
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
              statetype: StateType.FINISHED,
              created: MoreThan(dateRange),
            },
            {
              history: false,
              statetype: StateType.CANCELED,
              created: MoreThan(dateRange),
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
  static clearDynamicData():Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
          transactionalEntityManager.getRepository(Order).clear();
          transactionalEntityManager.getRepository(State).clear();
          transactionalEntityManager.getRepository(Session).clear();
          transactionalEntityManager.getRepository(Alert).clear();
        });
      } catch (e) {
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
  static createTableGroup(groupName: string):Promise<TableGroup> {
    return new Promise(async (resolve, reject) => {
      let tg = new TableGroup(groupName);
      try {
        tg = await AppDataSource.getRepository(TableGroup).save(tg);
      } catch (e) {
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
  static createTable(tableName: string, tableGroupId: number):Promise<Table> {
    return new Promise(async (resolve, reject) => {
      let table = new Table(tableName);
      try {
        let tg = await AppDataSource.getRepository(TableGroup).findOne({
          where: {
            id: tableGroupId,
          },
        });
        console.log(tg);
        if (tg == undefined) {
          return reject(
            "db/createTable: TableGroup not found id:" + tableGroupId
          );
        }
        table.tablegroup = tg;
        table = await AppDataSource.getRepository(Table).save(table);
      } catch (e) {
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
  static createStation(stationName: string):Promise<Station> {
    return new Promise(async (resolve, reject) => {
      let station = new Station(stationName);
      try {
        station = await AppDataSource.getRepository(Station).save(station);
      } catch (e) {
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
  static createOption(optionName: string):Promise<Ingredient> {
    return new Promise(async (resolve, reject) => {
      let option = new Ingredient(optionName);
      try {
        option = await AppDataSource.getRepository(Ingredient).save(option);
      } catch (e) {
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
  static createProduct(
    stationId: number,
    productName: string,
    deliverable: boolean,
    cost: number,
    _priority: number,
    _options: number[],
    _defaults: number[],
    _category: number
  ):Promise<Product> {
    return new Promise(async (resolve, reject) => {
      let product = new Product(productName, cost, deliverable);
      try {
        // Set additionall parameters
        product.list_priority = _priority;
        // Get and set station which produces this
        const s = await AppDataSource.getRepository(Station).findOneByOrFail({
          id: stationId,
        });
        product.producer = s;
        // Get Category
        const c = await AppDataSource.getRepository(Category).findOneBy({
          id: _category,
        });
        if (c != undefined) {
          product.category = c;
        }
        // Save product
        try {
          await AppDataSource.getRepository(Product).save(product);
        } catch (err) {
          return reject("db/createProduct: Save failed" + err);
        }
        // Get all defaults and option ingredients
        if (_defaults != undefined && _options != undefined) {
          let d: Ingredient[] = [];
          for (let i: number = 0; i < _defaults.length; i++) {
            let t: Ingredient;
            try {
              t = await AppDataSource.getRepository(Ingredient).findOneByOrFail(
                {
                  id: _defaults[i],
                }
              );
            } catch (err) {
              return reject(
                "db/createProduct: Ingredient not found, id " + i + err
              );
            }
            d.push(t);
          }
          // Get all optionals
          let opt = _options.filter((e) => {
            return !_defaults.includes(e);
          });
          let o: Ingredient[] = [];
          for (let i: number = 0; i < opt.length; i++) {
            let t: Ingredient;
            try {
              t = await AppDataSource.getRepository(Ingredient).findOneByOrFail(
                {
                  id: opt[i],
                }
              );
            } catch (err) {
              return reject(
                "db/createProduct: Ingredient not found, id " + i + err
              );
            }
            o.push(t);
          }
          // Create Product -> Ingredient Links
          let pi: ProductIngredient[] = [];
          d.forEach((e) => {
            console.log("default" + e);
            pi.push(new ProductIngredient(product, e, false));
          });
          o.forEach((e) => {
            console.log("optional" + e);
            pi.push(new ProductIngredient(product, e, true));
          });

          // Save links
          try {
            for (const element of pi) {
              await AppDataSource.getRepository(ProductIngredient).save(
                element
              );
            }
          } catch (err) {
            return reject(
              "db/createProduct: Save product ingredient failed" + err
            );
          }
        }

        console.log("db/createProduct: " + product.name + " created");
        return resolve(product);
      } catch (err) {
        return reject("db/createProduct: Query failed" + err);
      }
    });
  }

  /**
   * Removes a Product
   * @param  {Number} productId The product to be removed
   * @return {Promise} Returns a promise
   */
  static removeProduct(productId: number):Promise<boolean>{
    return new Promise(async (resolve, reject) => {
      try {
        let product = await AppDataSource.getRepository(Product).findOne({
          where: {
            id: productId,
          },
        });
        if (product == undefined) {
          return reject("db/removeProduct: Product not found id: " + productId);
        }
        await AppDataSource.getRepository(Product).remove(product);
      } catch (e) {
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
  static removeCategory(categoryId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let tmp = await AppDataSource.getRepository(Category).findOne({
          where: {
            id: categoryId,
          },
        });
        if (tmp == undefined) {
          return reject("db/removeCategory: Not found id: " + categoryId);
        }
        await AppDataSource.getRepository(Category).remove(tmp);
      } catch (e) {
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
  static removeTable(tableId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let table = await AppDataSource.getRepository(Table).findOne({
          where: {
            id: tableId,
          },
        });
        if (table == undefined) {
          return reject("db/removeTable: Table not found id: " + tableId);
        }
        await AppDataSource.getRepository(Table).remove(table);
      } catch (e) {
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
  static removeIngredient(ingredientId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let ingredient = await AppDataSource.getRepository(Ingredient).findOne({
          where: {
            id: ingredientId,
          },
        });
        if (ingredient == undefined) {
          return reject(
            "db/removeIngredient: Ingredient not found id: " + ingredientId
          );
        }
        await AppDataSource.getRepository(Ingredient).remove(ingredient);
      } catch (e) {
        return reject("db/removeIngredient: Failed to query" + e);
      }
      return resolve(true);
    });
  }

  /**
   * Get active sessions for a account
   * @param  {Account} Account to search for
   */
  static getActiveSessionsFromAccount(a: Account):Promise<Session[]> {
    return AppDataSource.getRepository(Session).find({
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
            statetype: Not(StateType.CLOSED),
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
   static getInactiveSessionsFromAccount(a: Account):Promise<Session[]> {
    let dateRange = new Date();
    dateRange.setHours(dateRange.getHours() - 1);
    return AppDataSource.getRepository(Session).find({
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
            statetype: StateType.CLOSED,
            created: MoreThan(dateRange)
          },
          // This account interacted with this session
          servers: {
            id: a.id,
          },
        },
      ],
      order:{
        states:{
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
  static getSoldByProduct(p: Product, date: Date):Promise<number> {
    return new Promise(async (resolve, reject) => {
      let c = AppDataSource.getRepository(Order).count({
        relations: {
          bill: true,
          product: true,
        },
        where: {
          bill: {
            paymentTime: MoreThan(date),
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
  static removeTableGroup(tableGroupId: number):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let tmp = await AppDataSource.getRepository(TableGroup).findOne({
          where: {
            id: tableGroupId,
          },
        });
        if (tmp == undefined) {
          return reject(
            "db/removeTableGroup: TableGroup not found id: " + tableGroupId
          );
        }
        await AppDataSource.getRepository(TableGroup).remove(tmp);
      } catch (e) {
        return reject("db/removeTableGroup: Remove query failed" + e);
      }
      return resolve(true);
    });
  }
}
