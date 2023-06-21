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
exports.ProductIngredient = void 0;
// Copyright Michael Selinger 2023
const typeorm_1 = require("typeorm");
const Ingredient_1 = require("./Ingredient");
const Product_1 = require("./Product");
let ProductIngredient = class ProductIngredient {
    constructor(p, i, opt) {
        this.product = p;
        this.ingredient = i;
        this.optional = opt;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductIngredient.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ProductIngredient.prototype, "optional", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, (product) => product.ingredients, {
        eager: true // If someone loads this class, always load opposite side
    }),
    __metadata("design:type", Product_1.Product)
], ProductIngredient.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Ingredient_1.Ingredient, (ingredient) => ingredient.products, {
        eager: true // If someone loads this class, always load opposite side
    }),
    __metadata("design:type", Ingredient_1.Ingredient)
], ProductIngredient.prototype, "ingredient", void 0);
ProductIngredient = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Product_1.Product, Ingredient_1.Ingredient, Boolean])
], ProductIngredient);
exports.ProductIngredient = ProductIngredient;
