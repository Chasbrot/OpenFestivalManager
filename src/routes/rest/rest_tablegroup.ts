// Copyright Michael Selinger 2023
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


/* GET all tablegroups */
router.get(
    "/",
    (_req: Request, res: Response) => {
      AppDataSource.getRepository(TableGroup)
        .find({
          relations: {
            tables: true
          }
        })
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
    }
  );


/* GET tables from tablegroup */
router.get(
    "/:tgid/tables",
    param("tgid").isInt(),
    (req: Request, res: Response) => {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(400);
        return;
      }
      AppDataSource.getRepository(Table)
        .find({
          relations: {
            tablegroup: true,
          },
          where: {
            tablegroup: {
              id: Number(req.params.tgid),
            },
          },
        })
        .then((result) => {
          if (req.session.account!.accounttype != AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
          }
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

/* PUT create ingredient*/
router.put(
  "/",
  body("name").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("create new tablegroup request");
    console.log(body);
    // Create PC
    try {
      let tmp = new TableGroup(body.name);
      await AppDataSource.getRepository(TableGroup).save(tmp);
    } catch (e) {
      console.log("rest/tablegroup/PUT new: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* DELETE tablegroup*/
router.delete(
  "/:tgid",
  param("tgid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("delete tablegroup request " + req.params.tgid);
    // Create Payment Method
    try {
      let tmp = await AppDataSource.getRepository(TableGroup).findOneOrFail({
        where: {
          id: Number(req.params.tgid),
        },
      });
      await AppDataSource.getRepository(TableGroup).remove(tmp);
    } catch (e) {
      console.log("rest/tablegroup/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
