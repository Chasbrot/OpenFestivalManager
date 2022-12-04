"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Variation_1 = require("./../../entity/Variation");
const Product_1 = require("../../entity/Product");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Station_1 = require("../../entity/Station");
const Category_1 = require("../../entity/Category");
/* CREATE product */
router.put("/", async (req, res) => {
    let body = req.body;
    console.log(req.body);
    if (body == null) {
        res.sendStatus(400);
        return;
    }
    let tmp;
    try {
        // Create new product required
        tmp = new Product_1.Product(body.name, Number(body.price), Boolean(body.deliverable));
        // Get producing station Required
        tmp.producer = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneByOrFail({
            id: Number(body.producer.id),
        });
        // Get category
        if (body.category && body.category.id) {
            tmp.category = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneBy({
                id: Number(body.category.id),
            });
        }
        // Get list priority
        if (body.list_priority) {
            tmp.list_priority = Number(body.list_priority);
        }
        // Get lock state
        if (body.productLock) {
            tmp.productLock = Number(body.productLock);
        }
        tmp.variations = [];
        tmp.ingredients = [];
        // Save object to db
        await data_source_1.AppDataSource.getRepository(Product_1.Product).save(tmp);
    }
    catch (e) {
        console.log("product/ PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({ id: tmp.id });
});
/* GET all with full data product */
router.get("/full", (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Product_1.Product)
        .find({
        relations: {
            producer: true,
            category: true,
            ingredients: true,
            variations: true,
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
/* GET variations by product */
router.get("/:pid/variations", (0, express_validator_1.param)("pid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Variation_1.Variation)
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
        res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET product */
router.get("/:pid", (0, express_validator_1.param)("pid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Product_1.Product)
        .find({
        relations: {
            producer: true,
        },
        where: {
            id: Number(req.params.pid),
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
/* Connect variation to product */
router.put("/:pid/variation", (0, express_validator_1.param)("pid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
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
        let p = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({ id: Number(req.params.pid) });
        v = new Variation_1.Variation(body.attrname, Number(body.price), p);
        if (!p.variations) {
            p.variations = [];
        }
        p.variations.push(v);
        await data_source_1.AppDataSource.getRepository(Variation_1.Variation).save(v);
        v = await data_source_1.AppDataSource.getRepository(Product_1.Product).save(v);
    }
    catch (e) {
        console.log("product/variation CREATE PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({ id: v.id });
});
/* UPDATE product */
router.put("/:pid", (0, express_validator_1.param)("pid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
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
        let oldProduct = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({ id: Number(req.params.pid) });
        // Update Data
        oldProduct.name = body.name;
        oldProduct.price = Number(body.price);
        oldProduct.deliverable = Boolean(body.deliverable);
        // Get producing station Required
        oldProduct.producer = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneByOrFail({
            id: Number(body.producer.id),
        });
        // Get category
        if (body.category && body.category.id) {
            oldProduct.category = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneBy({
                id: Number(body.category.id),
            });
        }
        // Get list priority
        if (body.list_priority) {
            oldProduct.list_priority = Number(body.list_priority);
        }
        // Get lock state
        if (body.productLock) {
            oldProduct.productLock = Number(body.productLock);
        }
        // Save object to db
        await data_source_1.AppDataSource.getRepository(Product_1.Product).save(oldProduct);
    }
    catch (e) {
        console.log("product/ PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
});
/* DELETE product */
router.delete("/:pid", (0, express_validator_1.param)("pid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneOrFail({
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
            await data_source_1.AppDataSource.getRepository(Variation_1.Variation).remove(tmp.variations);
        }
        // Delete Product
        await data_source_1.AppDataSource.getRepository(Product_1.Product).remove(tmp, { transaction: true });
    }
    catch (e) {
        console.log("rest/product/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
