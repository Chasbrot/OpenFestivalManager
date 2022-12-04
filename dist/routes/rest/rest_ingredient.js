"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Ingredient_1 = require("../../entity/Ingredient");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
/* GET ingredient */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient)
        .find()
        .then((result) => {
        res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* PUT create ingredient*/
router.put("/", async (req, res) => {
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
        let tmp = new Ingredient_1.Ingredient(body.name);
        await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).save(tmp);
    }
    catch (e) {
        console.log("rest/ingredient/PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE ingredient*/
router.delete("/:oid", (0, express_validator_1.param)("oid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete ingredient request");
    console.log(body);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneOrFail({
            where: {
                id: Number(req.params.oid),
            },
        });
        await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).remove(tmp);
    }
    catch (e) {
        console.log("rest/ingredient/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
