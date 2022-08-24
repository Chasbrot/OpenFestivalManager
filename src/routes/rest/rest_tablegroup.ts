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
import { TableGroup } from "../../entity/TableGroup";


/* GET all tablegroups */
router.get(
    "/",
    (_req: Request, res: Response) => {
      AppDataSource.getRepository(TableGroup)
        .find()
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


/* GET tables from tablegroup */
router.get(
    "/:tgid/tables",
    param("tgid").isInt(),
    (req: Request, res: Response) => {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(400);
        return;
      }
      AppDataSource.getRepository(Table)
        .find({
          relations: {
            tablegroup: true,
          },
          where: {
            tablegroup: {
              id: Number(req.params.tgid),
            },
          },
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



module.exports = router;
