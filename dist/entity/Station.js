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
var Station_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Station = void 0;
// Copyright Michael Selinger 2023
const typeorm_1 = require("typeorm");
const Account_1 = require("./Account");
let Station = Station_1 = class Station {
    constructor(name) {
        this.name = name;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Station.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 100,
        unique: true
    }),
    __metadata("design:type", String)
], Station.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, (account) => account.responsiblefor),
    __metadata("design:type", Account_1.Account)
], Station.prototype, "responsible", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Station_1, (product) => product.id),
    __metadata("design:type", Array)
], Station.prototype, "products", void 0);
Station = Station_1 = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [String])
], Station);
exports.Station = Station;
