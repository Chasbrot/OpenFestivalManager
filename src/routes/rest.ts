import { PaymentMethod } from "./../entity/PaymentMethod";
import { LockType, Product } from "./../entity/Product";
import { Ingredient } from "../entity/Ingredient";
import { Account, AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { createHash } from "crypto";
const router = express.Router();
import process from "process";
import { Station } from "../entity/Station";
import { Category } from "../entity/Category";
import { AlertType } from "../entity/AlertType";
import { Variation } from "../entity/Variation";
import { Table } from "../entity/Table";
import { Session } from "../entity/Session";
import { Order } from "../entity/Order";
import { StateType } from "../entity/State";
import { Not } from "typeorm";
import { db } from "../database";

const accountRepository = AppDataSource.getRepository(Account);

/* Check if request has a valid session*/
router.use(function (req, res, next) {
  if (req.session.account != null) {
    next();
  } else {
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

/* GET list accounttypes */
router.get("/accounttypes", async (_req: Request, res: Response) => {
  res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
  res.json(AccountType);
});

/* GET user account */
router.get(
  "/account/:id",
  param("id").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const user = await accountRepository.findOneBy({
      id: parseInt(req.params.id),
    });
    if (user == null) {
      res.sendStatus(404);
    } else {
      res.json(user);
    }
  }
);

/* PUT user account */
router.put(
  "/account",
  body("username").isAlphanumeric(),
  body("password").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    let a = new Account();
    a.name = req.body.username;
    // Hash password
    a.hash = createHash("sha256").update(req.body.password).digest("hex");
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
  }
);

/* GET server uptime */
router.get("/uptime", (_req: Request, res: Response) => {
  res.json(process.uptime());
});



/* POST create alert */
router.post(
  "/alert/:aid",
  param("aid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty() && !req.body.new) {
      res.sendStatus(400);
      return;
    }
    // Only stations are allowed
    if (req.session.account?.accounttype != AccountType.STATION) {
      res.sendStatus(403);
      return;
    }
    // Validate Alert ID
    let alerttype = null;
    try {
      alerttype = await AppDataSource.getRepository(AlertType).findOneByOrFail({
        id: Number(req.params.aid),
      });
    } catch (err) {
      console.log("rest/alert: POST create alert " + err);
      res.sendStatus(400);
      return;
    }

    await db.createAlert(alerttype, req.session.station!);

    res.sendStatus(200);
  }
);

/* GET registration active*/
router.get("/registrationactive", (_req: Request, res: Response) => {
  res.json({
    registrationactive: global.registrationActive,
  });
});

module.exports = router;
