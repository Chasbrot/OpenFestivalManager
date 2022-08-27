import { LockType } from './../../entity/Product';
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
      res.set('Cache-control', `max-age=${process.env.REST_CACHE_TIME}`)
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
          productLock: Not(LockType.HIDDEN)
        },
        order: {
          list_priority: "DESC"
        }
      })
      .then((result) => {
        res.set('Cache-control', `max-age=${process.env.REST_CACHE_TIME}`)
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN ||
      req.session.account!.accounttype == AccountType.STATION
  ) {
    next();
  } else {
    console.log("rest/station/auth: unauthorized");
    res.sendStatus(403);
  }
});

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
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);


module.exports = router;
