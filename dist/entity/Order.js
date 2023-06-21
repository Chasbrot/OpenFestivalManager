"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
// Copyright Michael Selinger 2023
const Account_1 = require("./Account");
const Product_1 = require("./Product");
const typeorm_1 = require("typeorm");
const Ingredient_1 = require("./Ingredient");
const Variation_1 = require("./Variation");
const State_1 = require("./State");
const Session_1 = require("./Session");
const Bill_1 = require("./Bill");
let Order = class Order {
    /**
     * Returns the current state
     */
    getCurrentState() {
        let state = null;
        this.states.forEach((s) => {
            if (!s.history) {
                state = s;
            }
        });
        this.currentState = state;
        return state;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, (product) => product.id),
    __metadata("design:type", Product_1.Product)
], Order.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, (account) => account.orders),
    __metadata("design:type", Account_1.Account)
], Order.prototype, "orderedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Variation_1.Variation, (variation) => variation.orders),
    __metadata("design:type", Variation_1.Variation)
], Order.prototype, "variation", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => State_1.State, (state) => state.order),
    __metadata("design:type", Array)
], Order.prototype, "states", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Session_1.Session, (session) => session.orders),
    __metadata("design:type", Session_1.Session)
], Order.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Bill_1.Bill, (bill) => bill.orders),
    __metadata("design:type", Bill_1.Bill)
], Order.prototype, "bill", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true
    }),
    __metadata("design:type", String)
], Order.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Ingredient_1.Ingredient),
    (0, typeorm_1.JoinTable)({ name: "order_ingredients" }),
    __metadata("design:type", Array)
], Order.prototype, "orderedIngredients", void 0);
Order = __decorate([
    (0, typeorm_1.Entity)()
], Order);
exports.Order = Order;
