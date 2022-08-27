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
import { State, StateType } from "../../entity/State";
import { MoreThan, Not } from "typeorm";

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (
    req.session.account!.accounttype == AccountType.ADMIN ||
    req.session.account!.accounttype == AccountType.USER
  ) {
    next();
  } else {
    console.log("rest/session/auth: unauthorized");
    res.sendStatus(403);
  }
});



/* PUT create new session on table */
router.put("/", async (req: Request, res: Response) => {
  const body = req.body;
  console.log("new session request");
  console.log(body);
  // Get Table
  let t, s;
  try {
    t = await AppDataSource.getRepository(Table).findOneOrFail({
      relations: {
        sessions: true,
      },
      where: {
        id: body.tid,
      },
    });
    //Check if table has a active session?
    s = await AppDataSource.getRepository(Session).findOne({
      relations: {
        states: true,
        table: true,
        servers: true,
      },
      where: {
        table: {
          id: t.id,
        },
        states: {
          history: false,
          statetype: Not(StateType.CLOSED),
        },
      },
    });

    if (s == null) {
      // No active session -> create new session
      s = new Session(t);
      s.servers = [];
      s.servers.push(req.session.account!);
      let state = new State(StateType.CREATED, req.session.account!);
      s.states = [];
      s.states.push(state);
      await AppDataSource.getRepository(State).save(state);
      await AppDataSource.getRepository(Session).save(s);
    } else {
      // Active session on this table -> link to account
      // Check if account is already linked
      if (!s.servers.some((e) => e.id == req.session.account!.id)) {
        s.servers.push(req.session.account!);
        console.log("[PUT]/rest/session/: linking user to session");
        await AppDataSource.getRepository(Session).save(s);
      }
    }
  } catch (e) {
    console.log("table/new: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.json({
    sid: s.id,
  });
});

/* GET session */
router.get("/:sid", param("sid").isInt(), (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Session)
      .find({
        relations: {
          table: true,
        },
        where: {
          id: Number(req.params.sid),
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

/* GET orders from session */
router.get(
  "/:sid/orders",
  param("sid").isInt(),
  (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    AppDataSource.getRepository(Order)
      .find({
        relations: {
          product: true,
          variation: true,
          states: true,
          session: true,
        },
        where: {
          session: {
            id: Number(req.params.sid),
          },
          states: {
            history: false,
            statetype: Not(StateType.CANCELED),
          },
        },
        order: {
          states: {
            statetype: "ASC",
            created: "ASC",
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
