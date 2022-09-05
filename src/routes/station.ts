import { ProductIngredient } from "./../entity/ProductIngredient";
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
import { TreeLevelColumn } from "typeorm";

const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (req.url.includes("login")) {
    next();
  } else {
    if (
      req.session.account &&
      (req.session.account.accounttype == AccountType.ADMIN ||
        req.session.account.accounttype == AccountType.STATION)
    ) {
      next();
    } else {
      console.log("station/auth: unauthorized, redirecting to login");
      res.redirect("/station/login");
      return;
    }
  }
});

/* GET login page */
router.get("/login", function (_req, res) {
  res.render("station/login_station", { err: "" });
});

/* Station login */
router.post(
  "/login",
  body("username").isAlphanumeric(),
  async function (req, res, _next) {
    if (!validationResult(req).isEmpty()) {
      res.render("station/login_station", { err: "Wrong input" });
      return;
    }
    let station = await AppDataSource.getRepository(Station).findOneBy({
      name: req.body.username,
    });
    if (station == undefined) {
      res.render("station/login_station", { err: "Cannot find station" });
      return;
    }
    req.session.account = new Account();
    req.session.account.id = station.id;
    req.session.account.accounttype = AccountType.STATION;
    res.redirect("/station/" + station.id);
  }
);

/* GET order entry html part*/
router.get("/orderentry/:oid", param("oid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("session/orderentry: Input validation failed");
    return;
  }
  let order, wt, rec;
  try {
    // Load session and error if null
    order = await AppDataSource.getRepository(Order).findOneOrFail({
      relations: {
        session: {
          table: true,
        },
        states: true,
        product: true,
        variation: true,
        orderedIngredients: true,
      },
      where: {
        id: req.params!.oid,
      },
    });
  } catch (e) {
    console.log("station/overview: Error" + e);
    res.sendStatus(500);
    return;
  }
  rec =
    order.getCurrentState()!.created.getHours() +
    ":" +
    order.getCurrentState()!.created.getMinutes();
  let createdState = order.states.find((v: State) => {
    if (v.statetype == StateType.CREATED) {
      return v;
    }
  })!;
  wt = (
    (new Date().valueOf() - createdState.created.valueOf()) /
    60000
  ).toFixed(0);

  // Difference map for ordered vs available ingredients
  let diffMap = await db.getOrderIngredientsDiffMap(order);

  res.render("station/orderentry", {
    order: order,
    waittime: wt,
    recieved: rec,
    special: order.note != "" || diffMap.size,
    ingredients: diffMap,
  });
});

/* GET station overview */
router.get("/:sid", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("session/overview: Input validation failed");
    return;
  }
  let station, po;
  try {
    // Load session and error if null
    station = await AppDataSource.getRepository(Station).findOneOrFail({
      where: {
        id: req.params!.sid,
      },
    });
  } catch (e) {
    console.log("station/overview: Error" + e);
    res.render("/station/login", { err: "System Error" });
    return;
  }

  res.render("station/station_overview_vue", {
    station: station,
    pre_orders: [],
  });
});

/* GET station overview */
router.post("/:sid", async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("session/overview: Input validation failed");
    return;
  }
  const body = req.body;
  /* Logout session*/
  if (body.logout) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("station/logout: session destroyed");
      }
    });
    res.redirect("/station/login");
    return;
  }
  try {
    if (body.oid) {
      let order = await db.getOrderFromId(body.oid);
      switch (body.change) {
        case "processingOrder":
          await db.setOrderStatus(
            order,
            StateType.COOKING,
            req.session.account!
          );
          break;
        case "sendingOrder":
          await db.setOrderStatus(
            order,
            StateType.DELIVERING,
            req.session.account!
          );
          break;
        case "deliveredOrder":
          await db.setOrderStatus(
            order,
            StateType.FINISHED,
            req.session.account!
          );
          break;
        case "canceledOrder":
          await db.setOrderStatus(
            order,
            StateType.CANCELED,
            req.session.account!
          );
          break;
        default:
          res.sendStatus(404);
          console.log("station/post: unkown data " + body);
          return;
      }
    }
  } catch (e) {
    console.log("station/post: Error" + e);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

module.exports = router;
