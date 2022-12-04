"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Product_1 = require("../../entity/Product");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Category_1 = require("../../entity/Category");
const typeorm_1 = require("typeorm");
/* GET categories */
router.get("/", (_req, res) => {
    data_source_1.AppDataSource.getRepository(Category_1.Category)
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
/* PUT create category*/
router.put("/", async (req, res) => {
    const body = req.body;
    console.log("create new product categories request");
    console.log(body);
    // Check content
    if (!body.name) {
        res.sendStatus(400);
        return;
    }
    // Create PC
    try {
        let pc = new Category_1.Category(body.name);
        await data_source_1.AppDataSource.getRepository(Category_1.Category).save(pc);
    }
    catch (e) {
        console.log("rest/categories/PUT new: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* GET products from category */
router.get("/:cid/products", (0, express_validator_1.param)("cid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    console.log(req.params.cid);
    data_source_1.AppDataSource.getRepository(Product_1.Product)
        .find({
        relations: {
            category: true,
            ingredients: true,
            variations: true,
        },
        where: {
            category: {
                id: Number(req.params.cid),
            },
            productLock: (0, typeorm_1.Not)(Product_1.LockType.HIDDEN),
        },
        order: {
            list_priority: "DESC",
        },
    })
        .then((result) => {
        res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* DELETE alerttype*/
router.delete("/:cid", (0, express_validator_1.param)("cid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete category request");
    console.log(body);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneOrFail({
            where: {
                id: Number(req.params.cid),
            },
        });
        await data_source_1.AppDataSource.getRepository(Category_1.Category).remove(tmp);
    }
    catch (e) {
        console.log("rest/category/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
