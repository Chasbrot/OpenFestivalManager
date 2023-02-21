import { stat } from "fs/promises";
import { Ingredient } from "./../entity/Ingredient";
import { Variation } from "./../entity/Variation";
import { Product } from "./../entity/Product";
import { Session } from "./../entity/Session";
import { Category } from "./../entity/Category";
import { TableGroup } from "../entity/TableGroup";
import { AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Account } from "../entity/Account";
import { createHash } from "crypto";
import { db } from "../database";
import { Order } from "../entity/Order";
import { State, StateType } from "../entity/State";
import { Table } from "../entity/Table";
import { Not } from "typeorm/find-options/operator/Not";
import { Station } from "../entity/Station";
import { relative } from "path";
import { IsNull, TreeLevelColumn } from "typeorm";
import { Bill } from "../entity/Bill";
import { PaymentMethod } from "../entity/PaymentMethod";
import { group } from "console";

const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account &&
    (req.session.account.accounttype == AccountType.ADMIN ||
      req.session.account.accounttype == AccountType.USER)
  ) {
    next();
  } else {
    console.log("table/auth: unauthorized, redirecting to login");
    res.redirect("/personal/login");
  }
});

/* GET new session */
router.get("/new", async function (_req, res) {
  let tg = await AppDataSource.getRepository(TableGroup).find();

  res.render("table/table_new", { table_groups: tg });
});

/* POST new session */
router.post("/new", body("table"), async function (req, res) {
  const body = req.body;

  if (!validationResult(req).isEmpty()) {
    res.redirect("/table/new");
    return;
  }
  console.log("new session request");
  console.log(body);
  // Get Table
  let t, s;
  try {
    t = await AppDataSource.getRepository(Table).findOneOrFail({
      relations: {
        sessions: true,
      },
      where: {
        id: body.table,
      },
    });
    //Check if table has a active session?
    s = await AppDataSource.getRepository(Session).findOne({
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
          statetype: Not(StateType.CLOSED),
        },
      },
    });

    if (s == null) {
      // No active session -> create new session
      s = new Session(t);
      s.servers = [];
      s.servers.push(req.session.account!);
      let state = new State(StateType.CREATED, req.session.account!);
      s.states = [];
      s.states.push(state);
      await AppDataSource.getRepository(State).save(state);
      await AppDataSource.getRepository(Session).save(s);
    } else {
      // Active session on this table -> link to account
      // Check if account is already linked
      if (!s.servers.some((e) => e.id == req.session.account!.id)) {
        s.servers.push(req.session.account!);
        console.log("linking user to session");
        await AppDataSource.getRepository(Session).save(s);
      }
    }
  } catch (e) {
    console.log("table/new: Error" + e);
    res.redirect("/table/new");
    return;
  }
  res.redirect("/table/" + s.id);
});


/* GET move session */
router.get("/:sid/move", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("table/overview: Input validation failed");
    return;
  }
  let tgs = await AppDataSource.getRepository(TableGroup).find();
  res.render("table/table_move", {
    table_groups: tgs,
    session_id: req.params!.sid,
  });
});
/* POST move session */
router.post("/:sid/move", param("sid").isInt(), async function (req, res) {
  const body = req.body;
  if (!validationResult(req).isEmpty()) {
    res.redirect("/personal/overview");
    return;
  }
  console.log(body);
  try {
    let s = await AppDataSource.getRepository(Session).findOneOrFail({
      relations: {
        table: true,
        states: true,
        bills: true,
        orders: true,
        servers: true,
      },
      where: {
        id: req.params!.sid,
      },
    });
    let table = await AppDataSource.getRepository(Table).findOneByOrFail({
      id: body.table,
    });
    // Get target session
    let target_session = await AppDataSource.getRepository(Session).findOne({
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
          statetype: StateType.CREATED,
        },
      },
    });

    // Check if target table has a active session
    if (target_session == null) {
      s.table = table;
      await AppDataSource.getRepository(Session).save(s);
      console.log(
        "table/moveSession: Moved session " + s.id + " to table " + table.id
      );
    } else {
      // Copy everything to target session
      await db.mergeSession(s, target_session, req.session.account!);
      console.log(
        "table/moveSession: Merged session " +
        s.id +
        " with " +
        target_session.id
      );
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }

  res.redirect("/personal/overview");
});

/* GET bill overview screen */
router.get("/:sid/bills", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("table/overview: Input validation failed");
    return;
  }

  try {
    res.render("table/table_bills_vue", {
      sid: req.params!.sid,
    });
  } catch (e) {
    console.log("table/bills: " + e);
    res.redirect("/table/" + req.params!.sid);
    return;
  }

});


/* GET billing screen */
router.get("/:sid/bill", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("table/overview: Input validation failed");
    return;
  }
  //console.log("Starting billing of session " + req.params!.sid);
  // Check if session exists
  try {
    await AppDataSource.getRepository(Session).findOneByOrFail({
      id: req.params!.sid,
    });
  } catch (e) {
    console.log("table/bill: Session not found " + req.params!.sid);
  }

  // Get billable order
  let o = await db.getBillableOrders(req.params!.sid);

  // Count all outstanding orders
  let countOpenOrders = await db.getOutstandingOrderCount(req.params!.sid);
  console.log(countOpenOrders);

  // Group orders to map
  let orderMap = new Map<Order, number>();
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
        } else if (oe.variation != null && key.variation != null && oe.variation.id == key.variation.id) {
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
    session_id: req.params!.sid,
    groupedOrders: orderMap,
    closeable: !countOpenOrders,
  });
});

/* POST billing screen */
router.post("/:sid/bill", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("table/overview: Input validation failed");
    return;
  }
  let body = req.body;
  console.log(body);

  if (body.payOrder && body.methodId) {

    // Get all keys from the request
    let keys = Object.keys(body);
    let refOrderIdMap = new Map<number, number>();
    keys.forEach(element => {
      var x = parseInt(element);
      if (!isNaN(x) && body[x] != 0) {
        refOrderIdMap.set(x, body[x]);
      }
    });

    // Generate new bill
    let bill = new Bill();
    bill.orders = [];
    // Get all orders for the bill
    try {
      for (const [rOId, amount] of refOrderIdMap) {
        // Load reference order
        let o = await AppDataSource.getRepository(Order).findOneOrFail({
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
        } else {
          // If more requested find x amount of similar orders
          // Check if variation is present
          let ords: Order[] = [];
          if (o.variation == null) {
            // No variation
            ords = await AppDataSource.getRepository(Order).find({
              relations: {
                session: true,
                product: true,
              },
              where: {
                session: { id: o.session.id },
                product: { id: o.product.id },
                bill: IsNull()
              },
              take: amount
            });
          } else {
            // Also check variation
            ords = await AppDataSource.getRepository(Order).find({
              relations: {
                session: true,
                product: true,
                variation: true,
              },
              where: {
                session: { id: o.session.id },
                product: { id: o.product.id },
                variation: { id: o.variation.id },
                bill: IsNull()
              },
              take: amount
            });
          }

          ords.forEach((e) => {
            bill.orders.push(e);
          })
        }
      }

      console.log(bill.orders);

      // Get payment method
      let pm = await AppDataSource.getRepository(PaymentMethod).findOneByOrFail({ id: body.methodId });

      // Additional information
      bill.cashier = req.session.account!;
      bill.method = pm;
      bill.session = await AppDataSource.getRepository(Session).findOneByOrFail({ id: req.params!.sid });
      bill.paymentTime = new Date();
      await AppDataSource.getRepository(Bill).save(bill);

    } catch (e) {
      console.log(e);
      res.redirect("/table/" + req.params!.sid + "/bill");
      return;
    }
  } else if (body.closeSession) {
    // Check if session can be closed
    if ((await db.getBillableOrders(req.params!.sid)).length == 0 && (await db.getOutstandingOrderCount(req.params!.sid)) == 0) {
      // Session can be closed
      let s = await AppDataSource.getRepository(Session).findOneByOrFail({ id: req.params!.sid });
      await db.setSessionStatus(s, StateType.CLOSED, req.session.account!);
      res.redirect("/personal/overview");
      return;
    }
  }

  res.redirect("/table/" + req.params!.sid + "/bill");
});


/* GET session overview */
router.get("/:sid", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("table/overview: Input validation failed");
    return;
  }
  let s, stations, orders;
  try {
    // Load session and error if null
    s = await AppDataSource.getRepository(Session).findOneOrFail({
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
        id: req.params!.sid,
      },
    });
    stations = await AppDataSource.getRepository(Station).find();
    orders = await AppDataSource.getRepository(Order).find({
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
          statetype: Not(StateType.CANCELED)
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
    let groupedOrders = new Map<Order[], number>();
    let singleOrders:Order[] = [];
    orders.forEach((o) => {
      if (o.getCurrentState()!.statetype == StateType.FINISHED) {
        // State either canceled or finished
        // Check if map contains similar product/variation combination
        let found = false;
        try {
          groupedOrders.forEach((v, k) => {
            if (k[0].getCurrentState()!.statetype == o.getCurrentState()!.statetype) { // k[0].product.id == o.product.id && 
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
        } catch (e) { };
        if (!found) {
          // Save single order to array and map
          // Add new product to map
          let orderarray: Order[] = [];
          orderarray.push(o);
          groupedOrders.set(orderarray, 1);
        }

      } else {
        // Save single order to array and map and never update since other state
        singleOrders.push(o);
      }

    });
    //console.log(groupedOrders);
    
    // Load all categories
    let cats = await AppDataSource.getRepository(Category).find();
    let catUnknown = new Category("?");
    catUnknown.id = -1;
    cats.push(catUnknown);




    res.render("table/table_overview_vue", {
      t: s.table,
      singleOrders: singleOrders,
      groupedOrders: groupedOrders,
      stations: cats,
      sid: req.params!.sid,
      closed: s.getCurrentState()!.statetype == StateType.CLOSED
    });
  } catch (e) {
    console.log("table/overview: Error" + e);
    res.redirect("/personal/overview");
    return;
  }


});

/* POST session overview */
router.post("/:sid", param("sid").isInt(), async function (req, res) {
  const body = req.body;
  if (!validationResult(req).isEmpty()) {
    res.redirect("/table/overview");
    return;
  }
  console.log(body);
  // Order new product
  if (body.productid) {
    try {
      // Get product object
      let pr = await AppDataSource.getRepository(Product).findOneByOrFail({
        id: req.body.productid,
      });
      // Get session object
      let s = await AppDataSource.getRepository(Session).findOneByOrFail({
        id: req.params!.sid,
      });

      // Create new order
      let o = new Order();
      o.orderedBy = req.session.account!;
      o.session = s;
      o.note = body.note;

      // Assign product
      o.product = pr;

      // Assign variation
      if (body.variationid) {
        let v = await AppDataSource.getRepository(Variation).findOneByOrFail({
          id: Number(body.variationid),
        });
        o.variation = v;
      }

      // Assign Options
      if (body.option) {
        o.orderedIngredients = [];
        for (const element of body.option) {
          let ingr = await AppDataSource.getRepository(
            Ingredient
          ).findOneByOrFail({
            id: Number(element),
          });
          o.orderedIngredients.push(ingr);
        }
      }

      // Create new state
      let state = new State(StateType.CREATED, req.session.account!);
      await AppDataSource.getRepository(State).save(state);
      o.states = [];
      o.states.push(state);
      // Save order
      await AppDataSource.getRepository(Order).save(o);
    } catch (e) {
      console.log("table/overview: Error" + e);
      res.redirect("/table/" + req.params!.sid);
      return;
    }
  }
  // Finish order
  if (body.finishOrder) {
    try {
      let ord = await AppDataSource.getRepository(Order).findOneByOrFail({
        id: req.body.finishOrder,
      });

      await db.setOrderStatus(ord, StateType.FINISHED, req.session.account!);
    } catch (e) {
      console.log("table/overview/finishOrder: Error" + e);
      res.redirect("/table/" + req.params!.sid);
      return;
    }
  }

  // Cancel order
  if (body.cancelOrder) {
    try {
      let ord = await AppDataSource.getRepository(Order).findOneByOrFail({
        id: req.body.cancelOrder,
      });
      await db.setOrderStatus(ord, StateType.CANCELED, req.session.account!);
    } catch (e) {
      console.log("table/overview/finishOrder: Error" + e);
      res.redirect("/table/" + req.params!.sid);
      return;
    }
  }

  res.redirect("/table/" + req.params!.sid);
});

/* GET product list for station */
router.get(
  "/productlist/station/:sid",
  param("sid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("table/productlist/station: Input validation failed");
      return;
    }
    let prods;
    try {
      prods = await AppDataSource.getRepository(Product).find({
        relations: {
          producer: true,
          ingredients: true,
          variations: true,
        },
        where: {
          producer: {
            id: req.params!.sid,
          },
        },
        order: {
          list_priority: "DESC",
        },
      });
    } catch (e) {
      res.sendStatus(500);
      return;
    }

    res.render("table/productlist_new", {
      products: prods,
      currentWaitTime: 60,
      simpleProducts: [],
    });
  }
);

/* GET product list for station */
router.get(
  "/productlist/category/:cid",
  param("cid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("table/productlist/category: Input validation failed");
      return;
    }
    let prods;
    try {
      if (req.params!.cid == -1) {
        // Load products without a category
        prods = await AppDataSource.getRepository(Product).find({
          relations: {
            ingredients: true,
            variations: true,
            category: true,
          },
        });
        // Check auf null geht ned in typeorm -> bug auf github
        prods = prods.filter((p) => p.category == null);
      } else {
        prods = await AppDataSource.getRepository(Product).find({
          relations: {
            ingredients: true,
            variations: true,
            category: true,
          },
          where: {
            category: {
              id: req.params!.cid,
            },
          },
          order: {
            list_priority: "DESC",
          },
        });
      }
      
    } catch (e) {
      res.sendStatus(500);
      return;
    }

    res.render("table/productlist_new", {
      products: prods,
      currentWaitTime: 60,
      simpleProducts: [],
    });
  }
);

/* GET order details page */
router.get(
  "/orderdetails/:oid",
  param("oid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("table/orderdetails: Input validation failed");
      return;
    }
    let order;
    try {
      order = await AppDataSource.getRepository(Order).findOneOrFail({
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
          id: Number(req.params!.oid),
        },
        order: {
          states: {
            created: "DESC",
          },
        },
      });
      //console.log(order);
    } catch (e) {
      res.sendStatus(500);
      return;
    }

    res.render("table/table_orderdetails", {
      o: order,
    });
  }
);



module.exports = router;
