import { db } from "./../../database";
import { LockType, Product } from "../../entity/Product";
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
import { StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";
import { TableGroup } from "../../entity/TableGroup";

/* GET alerttypes */
router.get("/", (_req: Request, res: Response) => {
  AppDataSource.getRepository(AlertType)
    .find()
    .then((result) => {
      if (_req.session.account!.accounttype != AccountType.ADMIN) {
        res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      }
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
  if (req.session.account!.accounttype == AccountType.ADMIN) {
    next();
  } else {
    console.log("rest/alerttypes/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* PUT create alerttype*/
router.put(
  "/",
  body("name").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("create new alerttype request");
    console.log(body);
    // Create AlertType
    try {
      let at = new AlertType(body.name);
      await AppDataSource.getRepository(AlertType).save(at);
    } catch (e) {
      console.log("rest/alerttype/PUT new: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* DELETE alerttype*/
router.delete(
  "/:atid",
  param("atid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    console.log("delete alerttype request " + req.params.atid);
    // Create Payment Method
    try {
      let tmp = await AppDataSource.getRepository(AlertType).findOneOrFail({
        where: {
          id: Number(req.params.atid),
        },
      });
      await AppDataSource.getRepository(AlertType).remove(tmp);
    } catch (e) {
      console.log("rest/alerttype/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
