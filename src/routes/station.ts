// Copyright Michael Selinger 2023
import { ProductIngredient } from "./../entity/ProductIngredient";
import { Ingredient } from "./../entity/Ingredient";
import { Variation } from "./../entity/Variation";
import { Product } from "./../entity/Product";
import { Session } from "./../entity/Session";
import { Category } from "./../entity/Category";
import { TableGroup } from "../entity/TableGroup";
import { AccountType } from "../entity/Account";
import { AppDataSource } from "../data-source";
import express, { Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Account } from "../entity/Account";
import { createHash } from "crypto";
import { db } from "../database";
import { Order } from "../entity/Order";
import { State, StateType } from "../entity/State";
import { Table } from "../entity/Table";
import { Not } from "typeorm/find-options/operator/Not";
import { Station } from "../entity/Station";
import { relative } from "path";
import { TreeLevelColumn } from "typeorm";

const router = express.Router();

/* Check session and accounttype*/
router.use(function (req, res, next) {
  if (req.url.includes("login")) {
    next();
  } else {
    if (
      req.session.account &&
      (req.session.account.accounttype == AccountType.ADMIN ||
        req.session.account.accounttype == AccountType.STATION)
    ) {
      next();
    } else {
      console.log("station/auth: unauthorized, redirecting to login");
      res.redirect("/station/login");
      return;
    }
  }
});

/* GET login page */
router.get("/login", function (req, res) {
  if (req.session.account?.accounttype == AccountType.STATION) {
    // Redirect tp mainpage if station session exists
    res.redirect("/station/" + req.session.station!.id);
  } else {
    res.render("station/login_station", { err: "" });
  }
});

/* Station login */
router.post(
  "/login",
  body("username").isAlphanumeric(),
  async function (req, res, _next) {
    if (!validationResult(req).isEmpty()) {
      res.render("station/login_station", { err: "Wrong input" });
      return;
    }
    let station = await AppDataSource.getRepository(Station).findOneBy({
      name: req.body.username,
    });
    if (station == undefined) {
      res.render("station/login_station", { err: "Cannot find station" });
      return;
    }
    // Check if station has an account
    let sa = await AppDataSource.getRepository(Account).findOneBy({
      name: req.body.username,
      accounttype: AccountType.STATION,
    });
    // if no account found create new one
    if (sa == null) {
      console.log("station/login_station/createStationUser Creating missing station user")
      sa = new Account();
      sa.name = station.name
      sa.accounttype = AccountType.STATION;
      sa.responsiblefor=[]
      sa.responsiblefor.push(station)
      try {
        await AppDataSource.getRepository(Account).insert(sa)
      } catch (err) {
        console.log("station/login_station/createStationUser " + err)
        res.render("station/login_station", { err: "Error creating user" });
        return;
      }
    }
    // Set session data
    req.session.station = station;
    req.session.account = sa;

    res.redirect("/station/" + station.id);
  }
);

/* GET station overview */
router.get("/:sid", param("sid").isInt(), async function (req, res) {
  if (!validationResult(req).isEmpty()) {
    res.sendStatus(400);
    console.log("session/overview: Input validation failed");
    return;
  }
  let station, po;
  try {
    // Load session and error if null
    station = await AppDataSource.getRepository(Station).findOneOrFail({
      where: {
        id: req.params!.sid,
      },
    });
  } catch (e) {
    console.log("station/overview: Error" + e);
    res.render("/station/login", { err: "System Error" });
    return;
  }

  res.render("station/station_overview", {
    station: station,
    pre_orders: [],
  });
});

/* GET station overview */
router.post("/:sid", async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    console.log("session/overview: Input validation failed");
    return;
  }
  const body = req.body;
  /* Logout session*/
  if (body.logout) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("station/logout: session destroyed");
      }
    });
    res.redirect("/station/login");
    return;
  }

  res.sendStatus(200);
});

module.exports = router;
