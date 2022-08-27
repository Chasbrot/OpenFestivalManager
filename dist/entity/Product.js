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
exports.Product = exports.LockType = void 0;
const typeorm_1 = require("typeorm");
const Category_1 = require("./Category");
const Station_1 = require("./Station");
const Variation_1 = require("./Variation");
const ProductIngredient_1 = require("./ProductIngredient");
var LockType;
(function (LockType) {
    LockType[LockType["NONE"] = 0] = "NONE";
    LockType[LockType["TEMPORARY"] = 1] = "TEMPORARY";
    LockType[LockType["INFINITE"] = 2] = "INFINITE";
    LockType[LockType["HIDDEN"] = 3] = "HIDDEN"; // Product is hidden and not available
})(LockType = exports.LockType || (exports.LockType = {}));
let Product = class Product {
    constructor(name, price, deliverable) {
        this.name = name;
        this.price = price;
        this.deliverable = deliverable;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Product.prototype, "deliverable", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: 0
    }),
    __metadata("design:type", Number)
], Product.prototype, "list_priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: LockType.NONE
    }),
    __metadata("design:type", Number)
], Product.prototype, "productLock", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Category_1.Category, (category) => category.products),
    __metadata("design:type", Category_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station, (station) => station.products),
    __metadata("design:type", Station_1.Station)
], Product.prototype, "producer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Variation_1.Variation, (variation) => variation.product),
    __metadata("design:type", Array)
], Product.prototype, "variations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProductIngredient_1.ProductIngredient, (ingredient) => ingredient.product),
    __metadata("design:type", Array)
], Product.prototype, "ingredients", void 0);
Product = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [String, Number, Boolean])
], Product);
exports.Product = Product;
