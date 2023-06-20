// Copyright Michael Selinger 2023
import { db } from "./../../database";
import { LockType, Product } from "../../entity/Product";
import { Ingredient } from "../../entity/Ingredient";
import { Account, AccountType } from "../../entity/Account";
import { AppDataSource, ds } from "../../data-source";
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
import { DataSourceOptions, MoreThan, Not } from "typeorm";
import { TableGroup } from "../../entity/TableGroup";
import { brotliDecompressSync } from "zlib";

/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN
  ) {
    next();
  } else {
    console.log("rest/system/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* GET all accounts */
router.get("/database/config", async (req: Request, res: Response) => {
    let dso = {
        connected: AppDataSource.isInitialized,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: "",
        dbname: process.env.DB_SCHEMA,
    }
    res.json(dso);
});


/* POST test accounts */
router.post("/database/test",
  body("host").isString(),
  body("port").isInt(),
  body("user").isAlphanumeric(),
  body("password").isString(),
  body("dbname").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      console.log(validationResult(req));
      res.sendStatus(400);
      return;
    }
    let body = req.body;
  if (await ds.createADS(body.host, body.port, body.user, body.password, body.dbname)) {
    res.json({ test_result: true });
  } else {
    if (!await ds.createADSFromFile()) {
      console.log("rest/system/database/test: Fallback to file failed! ");
      res.sendStatus(500);
    }
    res.json({ test_result: false });
    }
});

module.exports = router;
