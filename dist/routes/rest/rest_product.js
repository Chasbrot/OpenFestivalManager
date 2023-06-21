"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright Michael Selinger 2023
const ProductIngredient_1 = require("./../../entity/ProductIngredient");
const Category_1 = require("./../../entity/Category");
const Variation_1 = require("./../../entity/Variation");
const Ingredient_1 = require("./../../entity/Ingredient");
const Product_1 = require("../../entity/Product");
const Account_1 = require("../../entity/Account");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Station_1 = require("../../entity/Station");
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
        if (req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
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
        if (req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
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
        if (req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
        res.json(result);
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET ingredient by product */
router.get("/:pid/ingredients", (0, express_validator_1.param)("pid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Product_1.Product)
        .findOneOrFail({
        relations: {
            ingredients: true,
        },
        where: {
            id: Number(req.params.pid),
        },
    })
        .then((result) => {
        if (req.session.account.accounttype != Account_1.AccountType.ADMIN) {
            res.set("Cache-control", `max-age=${process_1.default.env.REST_CACHE_TIME}`);
        }
        res.json(result.ingredients);
    })
        .catch((err) => {
        console.log("product/ingredients GET: Error" + err);
        res.sendStatus(500);
    });
});
/* Check session and accounttype \/\/\/\/\/\/\/\/ ADMIN SPACE \/\/\/\/\/\/ */
router.use(function (req, res, next) {
    if (req.session.account.accounttype == Account_1.AccountType.ADMIN) {
        next();
    }
    else {
        console.log("rest/product/auth: unauthorized");
        res.sendStatus(403);
    }
});
/* CREATE product */
router.put("/", (0, express_validator_1.body)("name").isString(), (0, express_validator_1.body)("price").isFloat(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    if (global.dev) {
        console.log("create new product request");
        console.log(req.body);
    }
    let tmp;
    try {
        // Create new product required
        tmp = new Product_1.Product(body.name, Number(body.price), Boolean(body.deliverable) ? true : false);
        // Get producing station Required
        tmp.producer = await data_source_1.AppDataSource.getRepository(Station_1.Station).findOneByOrFail({
            id: Number(body.producer.id),
        });
        // Get category
        if (body.category != undefined && body.category.id) {
            tmp.category = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneBy({
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
        await data_source_1.AppDataSource.getRepository(Product_1.Product).save(tmp);
    }
    catch (e) {
        console.log("product/ PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({ id: tmp.id });
});
/* Connect variation to product */
router.put("/:pid/variation", (0, express_validator_1.param)("pid").isInt(), (0, express_validator_1.body)("attrname").isString(), (0, express_validator_1.body)("price").isFloat(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log(body);
    let v;
    try {
        // Load product
        let p = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({
            id: Number(req.params.pid),
        });
        v = new Variation_1.Variation(body.attrname, Number(body.price), p);
        v = await data_source_1.AppDataSource.getRepository(Variation_1.Variation).save(v);
    }
    catch (e) {
        console.log("product/variation CREATE PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.json({ id: v.id });
});
/* UPDATE product */
router.put("/:pid", (0, express_validator_1.param)("pid").isInt(), (0, express_validator_1.body)("name").isString(), (0, express_validator_1.body)("price").isFloat(), (0, express_validator_1.body)("deliverable").isBoolean(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
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
        if (body.category != undefined && body.category.id) {
            oldProduct.category = await data_source_1.AppDataSource.getRepository(Category_1.Category).findOneBy({
                id: Number(body.category.id),
            });
        }
        else if (body.category == undefined || body.category == "") {
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
    console.log("delete product request " + req.params.pid);
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneOrFail({
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
            await data_source_1.AppDataSource.getRepository(Variation_1.Variation).remove(tmp.variations);
        }
        // Delete Product
        await data_source_1.AppDataSource.getRepository(Product_1.Product).remove(tmp, {
            transaction: true,
        });
    }
    catch (e) {
        console.log("rest/product/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* PUT ingredient to product */
router.put("/:pid/ingredients", (0, express_validator_1.param)("pid").isInt(), (0, express_validator_1.body)("standard").isBoolean(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
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
        let p = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOneByOrFail({
            id: Number(req.params.pid),
        });
        let i = await data_source_1.AppDataSource.getRepository(Ingredient_1.Ingredient).findOneByOrFail({
            id: Number(body.ingredient.id),
        });
        let pi = new ProductIngredient_1.ProductIngredient(p, i, Boolean(body.standard));
        await data_source_1.AppDataSource.getRepository(ProductIngredient_1.ProductIngredient).save(pi);
    }
    catch (e) {
        console.log("product/ingredients PUT: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* DELETE ingredient from product */
router.delete("/ingredient/:iid", (0, express_validator_1.param)("iid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    console.log("delete ingredient from product request " + req.params.iid);
    try {
        // Load product
        let pi = await data_source_1.AppDataSource.getRepository(ProductIngredient_1.ProductIngredient).findOneByOrFail({ id: Number(req.params.iid) });
        await data_source_1.AppDataSource.getRepository(ProductIngredient_1.ProductIngredient).remove(pi);
    }
    catch (e) {
        console.log("product/ingredients DELETE: Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
