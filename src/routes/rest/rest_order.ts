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
import { State, StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN ||
    req.session.account!.accounttype == AccountType.USER
  ) {
    next();
  } else {
    console.log("rest/order/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* POST order/state */
/* Creates new state entry for a order*/
router.post(
  "/:oid/state",
  param("oid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty() && !req.body.new) {
      res.sendStatus(400);
      return;
    }
    try {
      let order = await AppDataSource.getRepository(Order).findOneByOrFail({
        id: Number(req.params.oid),
      });
      await db.setOrderStatus(order, req.body.new, req.session.account!);
    } catch (e) {
      console.log("rest/order/state POST: " + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* GET order */
router.get("/:oid", param("oid").isInt(), (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  AppDataSource.getRepository(Order)
    .findOne({
      relations: {
        states: true,
        variation: true,
        bill: true,
        product: true,
      },
      where: {
        id: Number(req.params.oid),
      },
    })
    .then((result) => {
      if (result == null) {
        res.sendStatus(404);
      } else {
        res.json(result);
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});


module.exports = router;
