import { ProductIngredient } from "./../../entity/ProductIngredient";
import { Category } from "./../../entity/Category";

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
import { AlertType } from "../../entity/AlertType";
import { Table } from "../../entity/Table";
import { Session } from "../../entity/Session";
import { Order } from "../../entity/Order";
import { StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";
import { TableGroup } from "../../entity/TableGroup";
import { toNamespacedPath } from "path";


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
      if (req.session.account!.accounttype != AccountType.ADMIN) {
        res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      }
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
        if (req.session.account!.accounttype != AccountType.ADMIN) {
          res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
        }
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
      if (req.session.account!.accounttype != AccountType.ADMIN) {
        res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
      }
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET ingredient by product */
router.get(
  "/:pid/ingredients",
  param("pid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Product)
      .findOneOrFail({
        relations: {
          ingredients: true,
        },
        where: {
          id: Number(req.params.pid),
        },
      })
      .then((result) => {
        if (req.session.account!.accounttype != AccountType.ADMIN) {
          res.set("Cache-control", `max-age=${process.env.REST_CACHE_TIME}`);
        }
        res.json(result.ingredients);
      })
      .catch((err) => {
        console.log("product/ingredients GET: Error" + err);
        res.sendStatus(500);
      });
  }
);

/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN
  ) {
    next();
  } else {
    console.log("rest/product/auth: unauthorized");
    res.sendStatus(403);
  }
});

/* CREATE product */
router.put(
  "/",
  body("name").isString(),
  body("price").isFloat(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    if (global.dev) {
      console.log("create new product request")
      console.log(req.body);
    }
    
    let tmp;
    try {
      // Create new product required
      tmp = new Product(
        body.name,
        Number(body.price),
        Boolean(body.deliverable) ? true : false
      );
      // Get producing station Required
      tmp.producer = await AppDataSource.getRepository(Station).findOneByOrFail(
        {
          id: Number(body.producer.id),
        }
      );
      // Get category
      if (body.category != undefined && body.category.id) {
        tmp.category = await AppDataSource.getRepository(Category).findOneBy({
          id: Number(body.category.id),
        });
      }
      // Get list priority
      if (body.list_priority != undefined) {
        tmp.list_priority = Number(body.list_priority);
      }
      // Get lock state
      if (body.productLock != undefined) {
        tmp.productLock = Number(body.productLock);
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
    res.json({ id: tmp.id });
  }
);

/* Connect variation to product */
router.put(
  "/:pid/variation",
  param("pid").isInt(),
  body("attrname").isString(),
  body("price").isFloat(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    console.log(body);
    let v;
    try {
      // Load product
      let p = await AppDataSource.getRepository(Product).findOneByOrFail({
        id: Number(req.params.pid),
      });
      v = new Variation(body.attrname, Number(body.price), p);
      v = await AppDataSource.getRepository(Variation).save(v);
    } catch (e) {
      console.log("product/variation CREATE PUT: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.json({ id: v.id });
  }
);

/* UPDATE product */
router.put(
  "/:pid",
  param("pid").isInt(),
  body("name").isString(),
  body("price").isFloat(),
  body("deliverable").isBoolean(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    try {
      // Load product
      let oldProduct = await AppDataSource.getRepository(
        Product
      ).findOneByOrFail({ id: Number(req.params.pid) });
      // Update Data
      oldProduct.name = body.name;
      oldProduct.price = Number(body.price);
      oldProduct.deliverable = Boolean(body.deliverable);
      // Get producing station Required
      oldProduct.producer = await AppDataSource.getRepository(
        Station
      ).findOneByOrFail({
        id: Number(body.producer.id),
      });
      // Get category
      if (body.category != undefined && body.category.id) {
        oldProduct.category = await AppDataSource.getRepository(
          Category
        ).findOneBy({
          id: Number(body.category.id),
        });
      } else if (body.category == undefined || body.category == "") {
        oldProduct.category = null;
      }
      // Get list priority
      if (body.list_priority != undefined) {
        oldProduct.list_priority = Number(body.list_priority);
      }
      // Get lock state
      if (body.productLock != undefined) {
        oldProduct.productLock = Number(body.productLock);
      }
      console.log(oldProduct);
      // Save object to db
      await AppDataSource.getRepository(Product).save(oldProduct);
    } catch (e) {
      console.log("product/ PUT: Error" + e);
      res.sendStatus(500);
      return;
    }
  }
);

/* DELETE product */
router.delete(
  "/:pid",
  param("pid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    console.log("delete product request " + req.params.pid);
    try {
      let tmp = await AppDataSource.getRepository(Product).findOneOrFail({
        relations: {
          ingredients: true,
          variations: true,
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
      await AppDataSource.getRepository(Product).remove(tmp, {
        transaction: true,
      });
    } catch (e) {
      console.log("rest/product/DELETE : Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* PUT ingredient to product */
router.put(
  "/:pid/ingredients",
  param("pid").isInt(),
  body("standard").isBoolean(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;
    if (body.ingredient == undefined) {
      res.sendStatus(400);
      return;
    }
    try {
      // Load product
      let p = await AppDataSource.getRepository(Product).findOneByOrFail({
        id: Number(req.params.pid),
      });
      let i = await AppDataSource.getRepository(Ingredient).findOneByOrFail({
        id: Number(body.ingredient.id),
      });
      let pi = new ProductIngredient(p, i, Boolean(body.standard));
      await AppDataSource.getRepository(ProductIngredient).save(pi);
    } catch (e) {
      console.log("product/ingredients PUT: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

/* DELETE ingredient from product */
router.delete(
  "/ingredient/:iid",
  param("iid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    console.log("delete ingredient from product request " + req.params.iid);
    try {
      // Load product
      let pi = await AppDataSource.getRepository(
        ProductIngredient
      ).findOneByOrFail({ id: Number(req.params.iid) });
      await AppDataSource.getRepository(ProductIngredient).remove(pi);
    } catch (e) {
      console.log("product/ingredients DELETE: Error" + e);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  }
);

module.exports = router;
