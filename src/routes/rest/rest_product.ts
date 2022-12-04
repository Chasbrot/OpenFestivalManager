
import { Variation } from "./../../entity/Variation";
import { Ingredient } from "./../../entity/Ingredient";
import { db } from "./../../database";
import { LockType, Product } from "../../entity/Product";
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
import { Table } from "../../entity/Table";
import { Session } from "../../entity/Session";
import { Order } from "../../entity/Order";
import { StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";
import { TableGroup } from "../../entity/TableGroup";
import { toNamespacedPath } from "path";


/* CREATE product */
router.put("/", async (req: Request, res: Response) => {
  let body = req.body;
  console.log(req.body);
  if (body == null) {
    res.sendStatus(400);
    return;
  }
  let tmp;
  try {
    // Create new product required
     tmp = new Product(
      body.name,
      Number(body.price),
      Boolean(body.deliverable)
    );
    // Get producing station Required
    tmp.producer = await AppDataSource.getRepository(Station).findOneByOrFail({
      id: Number(body.producer.id),
    });
    // Get category
    if (body.category && body.category.id) {
      tmp.category = await AppDataSource.getRepository(Category).findOneBy({
        id: Number(body.category.id),
      });
    }
    // Get list priority
    if (body.list_priority) {
      tmp.list_priority= Number(body.list_priority)
    }
    // Get lock state
    if (body.productLock) {
      tmp.productLock = Number(body.productLock)
    }
    tmp.variations = [];
    tmp.ingredients = [];
    // Save object to db
    await AppDataSource.getRepository(Product).save(tmp);
  } catch (e) {
    console.log("product/ PUT: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.json({id: tmp.id});
});

/* GET all with full data product */
router.get("/full", (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  AppDataSource.getRepository(Product)
    .find({
      relations: {
        producer: true,
        category: true,
        ingredients: true,
        variations: true,
      },
    })
    .then((result) => {
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET variations by product */
router.get(
  "/:pid/variations",
  param("pid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Variation)
      .find({
        relations: {
          product: true,
        },
        where: {
          product: {
            id: Number(req.params.pid),
          },
        },
      })
      .then((result) => {
        res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET product */
router.get("/:pid", param("pid").isInt(), (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  AppDataSource.getRepository(Product)
    .find({
      relations: {
        producer: true,
      },
      where: {
        id: Number(req.params.pid),
      },
    })
    .then((result) => {
      res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* Connect variation to product */
router.put("/:pid/variation", param("pid").isInt(), async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  let body = req.body;
  if (body == null) {
    res.sendStatus(400);
    return;
  }
  let v;
  try {
    // Load product
    let p = await AppDataSource.getRepository(Product).findOneByOrFail({ id: Number(req.params.pid) });
    v = new Variation(body.attrname, Number(body.price), p);
    if (!p.variations) {
      p.variations = [];
    }
    p.variations.push(v);
    await AppDataSource.getRepository(Variation).save(v)
    v = await AppDataSource.getRepository(Product).save(v);
  } catch (e) {
    console.log("product/variation CREATE PUT: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.json({ id: v.id });
});


/* UPDATE product */
router.put("/:pid", param("pid").isInt(), async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  let body = req.body;
  if (body == null) {
    res.sendStatus(400);
    return;
  }
  try {
    // Load product
    let oldProduct = await AppDataSource.getRepository(Product).findOneByOrFail({ id: Number(req.params.pid) });
    // Update Data
    oldProduct.name = body.name;
    oldProduct.price = Number(body.price);
    oldProduct.deliverable = Boolean(body.deliverable);
    // Get producing station Required
    oldProduct.producer = await AppDataSource.getRepository(Station).findOneByOrFail({
      id: Number(body.producer.id),
    });
    // Get category
    if (body.category && body.category.id) {
      oldProduct.category = await AppDataSource.getRepository(Category).findOneBy({
        id: Number(body.category.id),
      });
    }
    // Get list priority
    if (body.list_priority) {
      oldProduct.list_priority= Number(body.list_priority)
    }
    // Get lock state
    if (body.productLock) {
      oldProduct.productLock = Number(body.productLock)
    }
    // Save object to db
    await AppDataSource.getRepository(Product).save(oldProduct);
  } catch (e) {
    console.log("product/ PUT: Error" + e);
    res.sendStatus(500);
    return;
  }
});



/* DELETE product */
router.delete("/:pid", param("pid").isInt(), async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  try {
    let tmp = await AppDataSource.getRepository(Product).findOneOrFail({
      relations: {
        ingredients: true,
        variations: true
      },
      where: {
        id: Number(req.params.pid),
      },
    });
    // Remove all variations
    if (tmp.variations.length > 0) {
      await AppDataSource.getRepository(Variation).remove(tmp.variations);
    }
    // Delete Product
    await AppDataSource.getRepository(Product).remove(tmp, {transaction: true});
  } catch (e) {
    console.log("rest/product/DELETE : Error" + e);
    res.sendStatus(500);
    return;
  }
  res.sendStatus(200);
});



module.exports = router;
