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

/* GET all accounts */
router.get("/", (req: Request, res: Response) => {
  AppDataSource.getRepository(Account)
    .find({
      order: {
        id: "ASC",
      },
    })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log("rest/accounts/GET: " + err);
      res.sendStatus(500);
    });
});

/* PUT create user account */
router.put("/", async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  let body = req.body;
  if (!body.name || !body.password) {
    res.sendStatus(400);
    return;
    }
    console.log(body)
  let a = new Account();
  a.name = req.body.name;
  // Hash password
  a.hash = createHash("sha256").update(req.body.password).digest("hex");
    a.accounttype = req.body.accounttype;
    a.loginAllowed = req.body.loginAllowed;
  // Save new account
  AppDataSource.getRepository(Account)
    .save(a)
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log("/rest/account/PUT Error " + err);
      res.sendStatus(500);
    });
});

/* GET user account*/
router.get("/:id", param("id").isInt(), async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  AppDataSource.getRepository(Account)
    .findOneBy({
      id: parseInt(req.params.id),
    })
    .then((result) => {
      if (result == null) {
        res.sendStatus(404);
      } else {
        res.json(result);
      }
    })
    .catch((err) => {
      console.log("rest/account/GET :" + err);
      res.sendStatus(500);
    });
});

/* PUT update account */
router.put("/:aid", async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  let body = req.body;
  try {
    let a = await AppDataSource.getRepository(Account).findOneByOrFail({
      id: Number(req.params.aid),
    });
    a.accounttype = body.accounttype;
    a.name = body.name;
    a.loginAllowed = body.loginAllowed;
    if (body.password) {
      a.hash = createHash("sha256").update(body.password).digest("hex");
    }
    await AppDataSource.getRepository(Account).save(a);
  } catch (e) {
    console.log("rest/account/PUT update : Error" + e);
    res.sendStatus(500);
    return;
  }
  res.sendStatus(200);
});

/* GET user account*/
router.delete(
  "/:aid",
  param("id").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    try {
      let a = await AppDataSource.getRepository(Account).findOneByOrFail({
        id: Number(req.params.aid),
      });
      await AppDataSource.getRepository(Account).remove(a);
    } catch (e) {
      console.log("rest/account/delete: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
