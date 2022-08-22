import { PaymentMethod } from "./../entity/PaymentMethod";
import { Product } from "./../entity/Product";
import { Ingredient } from "../entity/Ingredient";
import { Account, AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { createHash } from "crypto";
const router = express.Router();
import process from "process";
import { Station } from "../entity/Station";
import { Category } from "../entity/Category";
import { AlertType } from "../entity/AlertType";
import { Variation } from "../entity/Variation";
import { Table } from "../entity/Table";
import { Session } from "../entity/Session";
import { Order } from "../entity/Order";
import { StateType } from "../entity/State";
import { Not } from "typeorm";

const accountRepository = AppDataSource.getRepository(Account);

/* Check if request has a valid session*/
router.use(function (req, res, next) {
  if (req.session.account != null) {
    next();
  } else {
    console.log("rest/auth: No vaild session detected");
    res.sendStatus(403);
  }
});

// Routers for extra rest files, load file
const restStationRouter = require("./rest/rest_station");
const restTableGroupRouter = require("./rest/rest_tablegroup");
const restTableRouter = require("./rest/rest_table");
const restSessionRouter = require("./rest/rest_session");

// Send for rest station to file, assign file
router.use("/station", restStationRouter);
router.use("/tablegroup", restTableGroupRouter);
router.use("/table", restTableRouter);
router.use("/session", restSessionRouter);

/* GET list accounttypes */
router.get("/accounttypes", async (_req: Request, res: Response) => {
  res.json(AccountType);
});

/* GET user account */
router.get(
  "/account/:id",
  param("id").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const user = await accountRepository.findOneBy({
      id: parseInt(req.params.id),
    });
    if (user == null) {
      res.sendStatus(404);
    } else {
      res.json(user);
    }
  }
);

/* PUT user account */
router.get(
  "/account",
  body("username").isAlphanumeric(),
  body("password").isString(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    let a = new Account();
    a.name = req.body.username;
    // Hash password
    a.hash = createHash("sha256").update(req.body.password).digest("hex");
    a.accounttype = req.body.accounttype;
    // Save new account
    accountRepository
      .save(a)
      .then(() => {
        res.sendStatus(200);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET server uptime */
router.get("/uptime", (_req: Request, res: Response) => {
  res.json(process.uptime());
});

/* GET options */
router.get("/options", (_req: Request, res: Response) => {
  AppDataSource.getRepository(Ingredient)
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET categories */
router.get("/categories", (_req: Request, res: Response) => {
  AppDataSource.getRepository(Category)
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET alerttypes */
router.get("/alerttypes", (_req: Request, res: Response) => {
  AppDataSource.getRepository(AlertType)
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET variations by product */
router.get(
  "/product/:pid/variations",
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
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET product */
router.get(
  "/product/:pid",
  param("pid").isInt(),
  (req: Request, res: Response) => {
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
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* GET order */
router.get(
  "/order/:oid",
  param("oid").isInt(),
  (req: Request, res: Response) => {
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
  }
);

/* GET paymentmethods */
router.get("/paymentmethod", (_req: Request, res: Response) => {
  AppDataSource.getRepository(PaymentMethod)
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

/* GET registration active*/
router.get("/registrationactive", (_req: Request, res: Response) => {
  res.json({
    registrationactive: global.registrationActive,
  });
});



module.exports = router;
