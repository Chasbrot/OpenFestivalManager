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
var Account_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = exports.AccountType = void 0;
const typeorm_1 = require("typeorm");
const Station_1 = require("./Station");
const State_1 = require("./State");
const Bill_1 = require("./Bill");
const Session_1 = require("./Session");
var AccountType;
(function (AccountType) {
    AccountType[AccountType["ADMIN"] = 0] = "ADMIN";
    AccountType[AccountType["USER"] = 1] = "USER";
    AccountType[AccountType["STATION"] = 2] = "STATION";
})(AccountType = exports.AccountType || (exports.AccountType = {}));
let Account = Account_1 = class Account {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 100,
        unique: true,
    }),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        select: false, // Default not included in selects (find etc.)
    }),
    __metadata("design:type", String)
], Account.prototype, "hash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-enum",
        enum: AccountType,
    }),
    __metadata("design:type", Number)
], Account.prototype, "accounttype", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: true
    }),
    __metadata("design:type", Boolean)
], Account.prototype, "loginAllowed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Station_1.Station, (station) => station.id),
    __metadata("design:type", Array)
], Account.prototype, "responsiblefor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Account_1, (order) => order.id),
    __metadata("design:type", Array)
], Account.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => State_1.State, (state) => state.triggerer),
    __metadata("design:type", Array)
], Account.prototype, "triggered", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Bill_1.Bill, (bill) => bill.cashier),
    __metadata("design:type", Array)
], Account.prototype, "bills", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Session_1.Session, (session) => session.servers),
    __metadata("design:type", Array)
], Account.prototype, "sessions", void 0);
Account = Account_1 = __decorate([
    (0, typeorm_1.Entity)()
], Account);
exports.Account = Account;
