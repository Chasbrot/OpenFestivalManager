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

/* GET sessions from table */
router.get(
    "/:tid/sessions",
    param("tid").isInt(),
    (req: Request, res: Response) => {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(400);
        return;
      }
      AppDataSource.getRepository(Session)
        .find({
          relations: {
            table: true,
            states: true
          },
          where: {
            table: {
              id: Number(req.params.tid),
            },
          },
        })
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
