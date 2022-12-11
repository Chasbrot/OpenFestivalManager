import { db } from "./../../database";
import { Product } from "../../entity/Product";
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

/* GET sessions from table */
router.get(
  "/:tid/sessions",
  param("tid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Session)
      .find({
        relations: {
          table: true,
          states: true,
        },
        where: {
          table: {
            id: Number(req.params.tid),
          },
        },
      })
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN
  ) {
    next();
  } else {
    console.log("rest/table/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* PUT create new table */
router.put(
  "/",
  body("name").isString(),
  body("tgid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty() && !req.body.pid) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("create new table request");
    console.log(body);
    // Create Table
    let tg;
    try {
      tg = await AppDataSource.getRepository(TableGroup).findOneOrFail({
        relations: {
          tables: true,
        },
        where: {
          id: Number(body.tgid),
        },
      });
      let table = new Table(body.name);
      tg.tables.push(table);
      await AppDataSource.getRepository(Table).save(table);
      await AppDataSource.getRepository(TableGroup).save(tg);
    } catch (e) {
      console.log("table/new: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* DELETE table*/
router.delete(
  "/:tid",
  param("tid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("delete table request " + req.params.tid);
    // Create Payment Method
    try {
      let tmp = await AppDataSource.getRepository(Table).findOneOrFail({
        where: {
          id: Number(req.params.tid),
        },
      });
      await AppDataSource.getRepository(Table).remove(tmp);
    } catch (e) {
      console.log("rest/table/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
