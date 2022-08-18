import { Session } from "./../entity/Session";
import { Category } from "./../entity/Category";
import { TableGroup } from "../entity/TableGroup";
import { AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Account } from "../entity/Account";
import { createHash } from "crypto";
import { db } from "../database";
import { Order } from "../entity/Order";
import { State, StateType } from "../entity/State";
import { Table } from "../entity/Table";
import { Not } from "typeorm/find-options/operator/Not";

const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (req.url.includes("login") || req.url.includes("registrierung")) {
    next();
  } else {
    if (
      req.session.account?.accounttype == AccountType.ADMIN ||
      req.session.account?.accounttype == AccountType.USER
    ) {
      next();
    } else {
      console.log("personal/auth: unauthorized, redirecting to login");
      res.redirect("/personal/login");
      return;
    }
  }
});

/* GET login page */
router.get("/login", function (_req, res) {
  res.render("personal/login_personal", { err: false });
});

/* Personal login */
router.post(
  "/login",
  body("username").isAlphanumeric(),
  async function (req, res, _next) {
    if (!validationResult(req).isEmpty()) {
      res.render("personal/login_personal", { err: true });
      return;
    }
    let user = await AppDataSource.getRepository(Account).findOneBy({
      name: req.body.username,
      accounttype: AccountType.USER,
    });
    if (user == undefined) {
      res.render("personal/login_personal", { err: true });
      return;
    }
    req.session.account = user;
    res.redirect("/personal/overview");
  }
);

/* Personal Overview */
router.get("/overview", async function (req, res) {
  let activeSessions, inactiveSessions;
  try {
    // Get active sessions
    activeSessions = await db.getActiveSessionsFromAccount(req.session.account!);
    inactiveSessions = await db.getInactiveSessionsFromAccount(req.session.account!);
  } catch (e) {
    console.log("personal/overview: " + e);
    res.render("personal/personal_overview", {
      personal_name: "Error",
      act_sessions: activeSessions,
      past_sessions: inactiveSessions,
    });
    return;
  }

  res.render("personal/personal_overview", {
    personal_name: req.session.account!.name,
    act_sessions: activeSessions,
    past_sessions: inactiveSessions,
  });
});

router.post("/overview", function (req, res) {
  // Logout request
  if (req.body.logout) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("session destroyed");
      }
    });
    res.redirect("/personal/login");
    return;
  }

  res.redirect("/personal/overview");
});

router.get("/registrierung", function (_req, res) {
  if (global.registrationActive) {
    res.render("personal/registrierung_personal", { err: false });
  } else {
    res.redirect("/personal/login");
  }
});

router.post(
  "/registrierung",
  body("username").isAlphanumeric(),
  async function (req, res, _next) {
    if (!validationResult(req).isEmpty()) {
      res.render("personal/registrierung_personal", { err: true });
      return;
    }

    let a = new Account();
    a.name = req.body.username;
    a.accounttype = AccountType.USER;

    try {
      await AppDataSource.getRepository(Account).save(a);
    } catch (e) {
      console.log("personal/register: " + e);
      res.render("personal/registrierung_personal", { err: true });
    }

    res.redirect("/personal/login");
  }
);

module.exports = router;
