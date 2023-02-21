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
router.get("/:sid/closedbills", param("sid").isInt(), async function (req, res) {
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
          paymentTime: "DESC"
        }
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

module.exports = router;
