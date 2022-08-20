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

/* GET stations */
router.put("/", (_req: Request, res: Response) => {
  AppDataSource.getRepository(Station)
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});
/* GET orders from session */
router.get(
  "/:sid/orders",
  param("sid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Session)
      .findOne({
        relations: {
          orders: true,
        },
        where: {
          id: Number(req.params.sid),
        },
      })
      .then((result) => {
        if (result == null) {
          res.sendStatus(404);
        } else {
          res.json(result.orders);
        }
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

module.exports = router;
