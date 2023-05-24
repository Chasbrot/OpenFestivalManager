import { PaymentMethod } from './../../entity/PaymentMethod';
import { ProductIngredient } from "../../entity/ProductIngredient";
import { db } from "../../database";
import { Ingredient } from "../../entity/Ingredient";
import { Account, AccountType } from "../../entity/Account";
import { AppDataSource } from "../../data-source";
import express, { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { createHash } from "crypto";
const router = express.Router();
import process from "process";
import { Station } from "../../entity/Station";
import { Category } from "../../entity/Category";
import { AlertType } from "../../entity/AlertType";
import { Variation } from "../../entity/Variation";
import { Table } from "../../entity/Table";
import { Session } from "../../entity/Session";
import { Order } from "../../entity/Order";
import { State, StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";
import { Bill } from "../../entity/Bill";

/* Check session and accounttype*/
// Every active session needs full access

/* Check session and accounttype only USER */
router.use(function (req, res, next) {
  if (
    req.session.account! &&
    req.session.account.accounttype == AccountType.USER
  ) {
    next();
  } else {
    console.log("rest/bill/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* GET bill overview screen */
router.get(
  "/:sid/closedbills",
  param("sid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("rest/billing/closedbills: Input validation failed");
      return;
    }

    try {
      let bills = await AppDataSource.getRepository(Bill).find({
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
            id: req.params!.sid,
          },
        },
        order: {
          paymentTime: "DESC",
        },
      });
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(bills);
    } catch (e) {
      console.log("rest/billing/closedbills: " + e);
      res.sendStatus(500);
    }
    return;
  }
);

/* GET all unpayed payable orders */
router.get(
  "/:sid/unpayedOrdersGrouped",
  param("sid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("rest/billing/unpayedOrdersGrouped: Input validation failed");
      return;
    }
    //console.log("Starting billing of session " + req.params!.sid);
    // Check if session exists
    try {
      await AppDataSource.getRepository(Session).findOneByOrFail({
        id: req.params!.sid,
      });
    } catch (e) {
      console.log(
        "rest/billing/unpayedOrdersGrouped: Session not found " +
          req.params!.sid
      );
    }

    // Get billable order
    let o = await db.getBillableOrders(req.params!.sid);

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
          if (oe.variation == null && key.variation == null) {
            // no variations, same product ++
            orderMap.set(key, value + 1);
            inserted = true;
          } else if (
            oe.variation != null &&
            key.variation != null &&
            oe.variation.id == key.variation.id
          ) {
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
  }
);

/* GET all payable orders orders */
router.get(
  "/:sid/billableOrders",
  param("sid").isInt(),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("rest/billing/unpayedOrdersGrouped: Input validation failed");
      return;
    }
    // Get billable order
    db.getBillableOrders(req.params!.sid)
      .then((r) => res.json(r))
      .catch((err) => {
        console.log("rest/billing/billableOrders: " + err);
        res.sendStatus(500);
      });
  }
);

/* GET if session has no open or unpayed orders */
router.get("/:sid/closeable", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("rest/billing/closeable: Input validation failed");
    return;
  }
  // Count all outstanding orders
  db.getOutstandingOrderCount(req.params!.sid).then((r) => {
    res.json({
      closeable: r == 0,
    });
  });
});

/* PUT Pay orders from session and generate bill */
router.put(
  "/:sid/pay",
  param("sid").isInt(),
  body("pmid").isInt(),
  body("orderids"),
  async function (req, res) {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      console.log("rest/billing/pay: Input validation failed");
      return;
    }

    // Get all keys from the request
    let orderids = req.body.orderids

    // Generate new bill
    let bill = new Bill();
    bill.orders = [];
    
    // Get all orders for the bill
    try {
      for (const oid of orderids) {
        // Load reference order
        let o = await AppDataSource.getRepository(Order).findOneOrFail({
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
      let pm = await AppDataSource.getRepository(PaymentMethod).findOneByOrFail({ id: Number(req.body.pmid) });

      // Additional information
      bill.cashier = req.session.account!;
      bill.method = pm;
      bill.session = await AppDataSource.getRepository(Session).findOneByOrFail({ id: req.params!.sid });
      bill.paymentTime = new Date();
      await AppDataSource.getRepository(Bill).save(bill);

      res.sendStatus(200);

    } catch (e) {
      console.log(e);
      res.sendStatus(500);
      return;
    }

    
  }
);

module.exports = router;
