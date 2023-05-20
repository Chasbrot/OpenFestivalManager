import { stat } from "fs/promises";
import { Ingredient } from "./../entity/Ingredient";
import { Variation } from "./../entity/Variation";
import { Product } from "./../entity/Product";
import { Session } from "./../entity/Session";
import { Category } from "./../entity/Category";
import { TableGroup } from "../entity/TableGroup";
import { AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Account } from "../entity/Account";
import { createHash } from "crypto";
import { db } from "../database";
import { Order } from "../entity/Order";
import { State, StateType } from "../entity/State";
import { Table } from "../entity/Table";
import { Not } from "typeorm/find-options/operator/Not";
import { Station } from "../entity/Station";
import { relative } from "path";
import { IsNull, TreeLevelColumn } from "typeorm";
import { Bill } from "../entity/Bill";
import { PaymentMethod } from "../entity/PaymentMethod";
import { group } from "console";

const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account &&
    (req.session.account.accounttype == AccountType.ADMIN ||
      req.session.account.accounttype == AccountType.USER)
  ) {
    next();
  } else {
    console.log("table/auth: unauthorized, redirecting to login");
    res.redirect("/personal/login");
  }
});

/* GET new session */
router.get("/", async function (_req, res) {


  res.render("webui/main");
});




module.exports = router;
