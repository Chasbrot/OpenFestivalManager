"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./../../database");
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const process_1 = __importDefault(require("process"));
const Order_1 = require("../../entity/Order");
/* Check session and accounttype*/
// Every active session needs full access
/* POST order/state */
/* Creates new state entry for a order*/
router.post("/:oid/state", (0, express_validator_1.param)("oid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty() && !req.body.new) {
        res.sendStatus(400);
        return;
    }
    try {
        let order = await data_source_1.AppDataSource.getRepository(Order_1.Order).findOneByOrFail({
            id: Number(req.params.oid),
        });
        await database_1.db.setOrderStatus(order, req.body.new, req.session.account);
    }
    catch (e) {
        console.log("rest/order/state POST: " + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
/* GET order */
router.get("/:oid", (0, express_validator_1.param)("oid").isInt(), (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    data_source_1.AppDataSource.getRepository(Order_1.Order)
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
        }
        else {
            res.json(result);
        }
    })
        .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});
/* GET ordered Ingredients map from order */
router.get("/:oid/oIMap", (0, express_validator_1.param)("oid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    let product = null;
    let order = null;
    try {
        order = await data_source_1.AppDataSource.getRepository("Order").findOneOrFail({
            relations: {
                orderedIngredients: true,
                product: true,
            },
            where: {
                id: Number(req.params.oid),
            },
        });
        product = await data_source_1.AppDataSource.getRepository("Product").findOneOrFail({
            relations: {
                ingredients: true,
            },
            where: {
                id: Number(order.product.id),
            },
        });
    }
    catch (e) {
        console.log("rest/Order/oIMap: " + e);
        res.sendStatus(500);
        return;
    }
    let aI = product.ingredients;
    let oI = order.orderedIngredients;
    // Generate difference map
    let oIMap = [];
    for (let pi of aI) {
        let found = false;
        for (let i of oI) {
            if (i.id == pi.ingredient.id) {
                // Ingredient was ordered
                found = true;
            }
        }
        if (pi.optional && found) {
            // Ingredient is optional and was selected
            oIMap.push([pi.ingredient, true]);
        }
        else if (!pi.optional && !found) {
            // Ingredient is default and was removed
            oIMap.push([pi.ingredient, false]);
        }
    }
    res.set('Cache-control', `max-age=${process_1.default.env.REST_CACHE_TIME}`);
    res.json(oIMap);
});
module.exports = router;
