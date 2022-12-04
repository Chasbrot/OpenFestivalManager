"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../../data-source");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const Variation_1 = require("../../entity/Variation");
/* DELETE alerttype*/
router.delete("/:vid", (0, express_validator_1.param)("vid").isInt(), async (req, res) => {
    if (!(0, express_validator_1.validationResult)(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    const body = req.body;
    console.log("delete variation request");
    console.log(body);
    // Create Payment Method
    try {
        let tmp = await data_source_1.AppDataSource.getRepository(Variation_1.Variation).findOneOrFail({
            where: {
                id: Number(req.params.vid),
            },
        });
        await data_source_1.AppDataSource.getRepository(Variation_1.Variation).remove(tmp);
    }
    catch (e) {
        console.log("rest/variation/DELETE : Error" + e);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});
module.exports = router;
