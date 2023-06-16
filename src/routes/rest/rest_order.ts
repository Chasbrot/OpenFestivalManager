import { ProductIngredient } from "./../../entity/ProductIngredient";
import { db } from "./../../database";
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
// Every active session needs full access

/* Check session and accounttype */
router.use(function (req, res, next) {
  if (req.session.account!) {
    next();
  } else {
    console.log("rest/order/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* GET all dates where a order was placed*/
router.get("/dates", async (req: Request, res: Response) => {
  AppDataSource.createQueryBuilder()
    .select("datetime(strftime('%Y-%m-%d',created)) AS day")
    .from(State, "state")
    .distinct()
    .orderBy({day: "DESC"})
    .getRawMany()
    .then((result) => {
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    })
    .catch((err) => {
      console.log("rest/order/dates GET: " + err);
      res.sendStatus(500);
    });
});



/* GET all open orders */
router.get("/open", async (req: Request, res: Response) => {
  try {
    let o = await AppDataSource.getRepository(Order).find({
      relations: {
        states: true,
      },
      where: {
        // Which are NOT finished
        states: {
          history: false,
          statetype: Not(StateType.CLOSED || StateType.CANCELED),
        },
      },
    });
    res.json(o);
  } catch (e) {
    console.log("rest/order/open GET: " + e);
    res.sendStatus(500);
  }
});

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

/* GET ordered Ingredients map from order */
router.get(
  "/:oid/oIMap",
  param("oid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    let product = null;
    let order = null;
    try {
      order = await AppDataSource.getRepository("Order").findOneOrFail({
        relations: {
          orderedIngredients: true,
          product: true,
        },
        where: {
          id: Number(req.params.oid),
        },
      });

      product = await AppDataSource.getRepository("Product").findOneOrFail({
        relations: {
          ingredients: true,
        },
        where: {
          id: Number(order.product.id),
        },
      });
    } catch (e) {
      console.log("rest/Order/oIMap: " + e);
      res.sendStatus(500);
      return;
    }

    let aI: ProductIngredient[] = product.ingredients;
    let oI: Ingredient[] = order.orderedIngredients;

    // Generate difference map
    let oIMap = [];

    for (let pi of aI) {
      let found = false;
      for (let i of oI) {
        if (i.id == pi.ingredient.id) {
          // Ingredient was ordered
          found = true;
        }
      }
      if (pi.optional && found) {
        // Ingredient is optional and was selected
        oIMap.push([pi.ingredient, true]);
      } else if (!pi.optional && !found) {
        // Ingredient is default and was removed
        oIMap.push([pi.ingredient, false]);
      }
    }
    res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
    res.json(oIMap);
  }
);



/* POST order/state */
/* Creates new state entry for a order*/
router.post(
  "/:oid/state",
  param("oid").isInt(),
  body("new").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    console.log(req.body)
    console.log(req.params.oid)
    console.log(req.session.account)
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

module.exports = router;
