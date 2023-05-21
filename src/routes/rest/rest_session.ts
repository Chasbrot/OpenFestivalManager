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
router.put("/", body("tid").isInt(), async (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
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
    console.log("rest/session/new PUT: Error" + e);
    res.sendStatus(500);
    return;
  }
  res.json({
    sid: s.id,
  });
});

/* GET all global active sessions */
router.get("/active", async (req: Request, res: Response) => {

  try {
    let s = await AppDataSource.getRepository(Session).find({
      relations: {
        states: true,
      },
      where:
      {
        // Which are NOT closed
        states: {
          history: false,
          statetype: Not(StateType.CLOSED),
        },
      },
    });
    res.json(s);

  } catch (e) {
    console.log("rest/session/active GET: " + e);
    res.sendStatus(500);
    return;
  }
});

/* GET all active sessions from a user */
router.get("/activeByUser", async (req: Request, res: Response) => {
  try {
    let as = await db.getActiveSessionsFromAccount(req.session.account!);
    res.json(as);

  } catch (e) {
    console.log("rest/session/activeByUser GET: " + e);
    res.sendStatus(500);
    return;
  }
});

/* GET all inactive sessions from a user */
router.get("/inactiveByUser", async (req: Request, res: Response) => {

  try {
    let as = await db.getInactiveSessionsFromAccount(req.session.account!);
    res.json(as);

  } catch (e) {
    console.log("rest/session/inactiveByUser GET: " + e);
    res.sendStatus(500);
    return;
  }
});

/* GET session */
router.get("/:sid", param("sid").isInt(), (req: Request, res: Response) => {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  AppDataSource.getRepository(Session)
    .findOneOrFail({
      relations: {
        table: true,
        states: true,
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
        result.forEach((r) => {
          // Load current states to objects
          r.getCurrentState();
        });
        res.json(result);
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  }
);

/* PUT create order */
router.put(
  "/:sid",
  param("sid").isInt(),
  body("vid").isInt(),
  body("pid").isInt(),
  body("note").isString(),
  async (req: Request, res: Response) => {
    // Request must have a product id
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    const body = req.body;

    try {
      let order = await db.createOrder(
        req.session.account!.id,
        Number(req.params.sid),
        body.pid,
        body.note,
        body.options,
        body.vid
      );
      res.json({
        oid: order.id,
      });
    } catch (e) {
      console.log("rest/session/order PUT: " + e);
      res.sendStatus(500);
    }
  }
);

/* POST move session to other table */
router.put("/:sid/move", param("sid").isInt(), body("targetTid").isInt(), async function (req, res) {
  const body = req.body;
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    return;
  }
  console.log(body);
  try {
    let s = await AppDataSource.getRepository(Session).findOneOrFail({
      relations: {
        table: true,
        states: true,
        bills: true,
        orders: true,
        servers: true,
      },
      where: {
        id: req.params!.sid,
      },
    });
    let table = await AppDataSource.getRepository(Table).findOneByOrFail({
      id: body.table,
    });
    // Get target session
    let target_session = await AppDataSource.getRepository(Session).findOne({
      relations: {
        table: true,
        states: true,
        bills: true,
        orders: true,
        servers: true,
      },
      where: {
        table: {
          id: req.body.targetTid,
        },
        states: {
          history: false,
          statetype: StateType.CREATED,
        },
      },
    });

    // Check if target table has a active session
    if (target_session == null) {
      s.table = table;
      await AppDataSource.getRepository(Session).save(s);
      console.log(
        "table/moveSession: Moved session " + s.id + " to table " + table.id
      );
      res.json(s.id);
    } else {
      // Copy everything to target session
      await db.mergeSession(s, target_session, req.session.account!);
      console.log(
        "table/moveSession: Merged session " +
        s.id +
        " with " +
        target_session.id
      );
      res.json(target_session.id);
    }

  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

/* GET orders from session */
router.post(
  "/:sid/close",
  param("sid").isInt(),
  async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(400);
      return;
    }
    try {
      // Check if session can be closed
      let sid = Number(req.params.sid)
      if ((await db.getBillableOrders(sid)).length == 0 && (await db.getOutstandingOrderCount(sid)) == 0) {
        // Session can be closed
        let s = await AppDataSource.getRepository(Session).findOneByOrFail({ id: sid });
        await db.setSessionStatus(s, StateType.CLOSED, req.session.account!);
        res.sendStatus(200);
      }else{
        res.sendStatus(403);
      }

    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
    
  }
);



module.exports = router;
