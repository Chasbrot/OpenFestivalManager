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

/* GET ingredient */
router.get("/", (_req: Request, res: Response) => {
    AppDataSource.getRepository(Ingredient)
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
  

/* PUT create ingredient*/
router.put("/", async (req: Request, res: Response) => {
    const body = req.body;
    console.log("create new ingredient request");
    console.log(body);
    // Check content
    if (!body.name) {
      res.sendStatus(400);
      return;
    }
    // Create PC
    try {
      let tmp = new Ingredient(body.name);
      await AppDataSource.getRepository(Ingredient).save(tmp);
    } catch (e) {
      console.log("rest/ingredient/PUT new: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  });
  
  /* DELETE ingredient*/
  router.delete(
    "/:oid",
    param("oid").isInt(),
    async (req: Request, res: Response) => {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(400);
        return;
      }
      const body = req.body;
      console.log("delete ingredient request");
      console.log(body);
      // Create Payment Method
      try {
        let tmp = await AppDataSource.getRepository(Ingredient).findOneOrFail({
          where: {
            id: Number(req.params.oid),
          },
        });
        await AppDataSource.getRepository(Ingredient).remove(tmp);
      } catch (e) {
        console.log("rest/ingredient/DELETE : Error" + e);
        res.sendStatus(500);
        return;
      }
      res.sendStatus(200);
    }
  );

module.exports = router;
