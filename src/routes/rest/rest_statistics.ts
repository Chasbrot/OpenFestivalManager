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
import { Between, MoreThan, Not } from "typeorm";
import { TableGroup } from "../../entity/TableGroup";
import { brotliDecompressSync } from "zlib";

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account &&
    req.session.account!.accounttype == AccountType.ADMIN
  ) {
    next();
  } else {
    console.log("rest/account/auth: unauthorized");
    res.sendStatus(401);
    return;
  }
});

/* GET all dates where a order was placed*/
/* If station id = -1 not filter for station*/
router.post(
  "/dailyordersfromstation",
  body("date").isISO8601(),
  body("sid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    // Parse date range
    let beginDateRange = new Date(req.body.date);
    beginDateRange.setHours(0);
    beginDateRange.setMinutes(0);
    let endDateRange = new Date(req.body.date);
    endDateRange.setHours(23);
    endDateRange.setMinutes(59);
    console.log(beginDateRange);
    console.log(endDateRange);

    let result;
    try {
      // Check for station id
      if (req.body.sid == -1) {
          // Dont' filter for station
        result = await AppDataSource.getRepository(Order).find({
          relations: {
            // Load target station
            product: {
              producer: true,
            },
            states: true,
          },
          where: {
            // Was created on that date
            states: {
              history: false,
              created: Between(beginDateRange, endDateRange),
            },
          },
        });
      } else {
        result = await AppDataSource.getRepository(Order).find({
          relations: {
            // Load target station
            product: {
              producer: true,
            },
            states: true,
          },
          where: {
            // Was created on that date
            states: {
              history: false,
              created: Between(beginDateRange, endDateRange),
            },
            // Target station
            product: {
              producer: {
                id: Number(req.body.sid),
              },
            },
          },
        });
      }

      result.forEach((e) => e.getCurrentState());
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    } catch (e) {
      console.log("rest/statistics/dailyordersfromstation GET/POST: " + e);
      res.sendStatus(500);
    }
  }
);


module.exports = router;
