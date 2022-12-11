import { LockType } from "./../../entity/Product";
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

/* GET stations */
router.get("/", (_req: Request, res: Response) => {
  AppDataSource.getRepository(Station)
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

/* GET products by station */
router.get(
  "/:sid/products",
  param("sid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Product)
      .find({
        relations: {
          producer: true,
          ingredients: true,
          variations: true,
        },
        where: {
          producer: {
            id: Number(req.params.sid),
          },
          productLock: Not(LockType.HIDDEN),
        },
        order: {
          list_priority: "DESC",
        },
      })
      .then((result) => {
        res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET active orders from station */
router.get(
  "/:sid/activeorders",
  param("sid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    db.getActiveOrdersForStation(Number(req.params.sid))
      .then((result) => {
        result.forEach((e) => {
          e.getCurrentState();
        });
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET past orders from station */
router.get(
  "/:sid/pastorders",
  param("sid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    db.getPastOrdersForStation(Number(req.params.sid))
      .then((result) => {
        result.forEach((e) => {
          e.getCurrentState();
        });
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
    console.log("rest/station/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* PUT create new station */
router.put(
  "/",
  body("name").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty() && !req.body.pid) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("create new station request");
    console.log(body);
    // Create Table
    let tg;
    try {
      let station = new Station(body.name);
      await AppDataSource.getRepository(Station).save(station);
    } catch (e) {
      console.log("rest/station/PUT new: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* DELETE station*/
router.delete(
  "/:sid",
  param("sid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("delete station request " + req.params.sid);
    // Create Payment Method
    try {
      let tmp = await AppDataSource.getRepository(Station).findOneOrFail({
        where: {
          id: Number(req.params.sid),
        },
      });
      await AppDataSource.getRepository(Station).remove(tmp);
    } catch (e) {
      console.log("rest/station/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
