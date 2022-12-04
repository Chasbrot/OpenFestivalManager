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
import { PaymentMethod } from "../../entity/PaymentMethod";

/* GET paymentmethods */
router.get("/", (_req: Request, res: Response) => {
  AppDataSource.getRepository(PaymentMethod)
    .find()
    .then((result) => {
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* PUT create paymentmethod*/
router.put("/", async (req: Request, res: Response) => {
  const body = req.body;
  console.log("create new paymentmethod request");
  console.log(body);
  // Check content
  if (!body.name) {
    res.sendStatus(400);
    return;
  }
  // Create Payment Method
  try {
    let pm = new PaymentMethod();
    pm.name = body.name;
    await AppDataSource.getRepository(PaymentMethod).save(pm);
  } catch (e) {
    console.log("rest/paymentmethod/PUT new: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.sendStatus(200);
});

/* GET default paymentmethod */
router.get("/default", (_req: Request, res: Response) => {
  AppDataSource.getRepository(PaymentMethod)
    .findOneByOrFail({ default: true })
    .then((result) => {
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* PUT set default payment method*/
router.put("/default", async (req: Request, res: Response) => {
  const body = req.body;
  console.log("create new paymentmethod request");
  console.log(body);
  // Check content
  if (!body.pmid) {
    res.sendStatus(400);
    return;
  }
  // Create Payment Method
  try {
    let new_default = await AppDataSource.getRepository(
      PaymentMethod
    ).findOneByOrFail({ id: Number(body.pmid) });
    let old_default = await AppDataSource.getRepository(
      PaymentMethod
    ).findOneByOrFail({ default: true });
    old_default.default = false;
    new_default.default = true;
    await AppDataSource.getRepository(PaymentMethod).save(old_default);
    await AppDataSource.getRepository(PaymentMethod).save(new_default);
  } catch (e) {
    console.log("rest/paymentmethod/default PUT new: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.sendStatus(200);
});

/* DELETE alerttype*/
router.delete(
  "/:pmid",
  param("pmid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log("delete paymentmethod request");
    console.log(body);
    // Create Payment Method
    try {
      let pm = await AppDataSource.getRepository(PaymentMethod).findOneOrFail({
        where: {
          id: Number(req.params.pmid),
        },
      });
      await AppDataSource.getRepository(PaymentMethod).remove(pm);
    } catch (e) {
      console.log("rest/paymentmethod/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
