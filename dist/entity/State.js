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
exports.State = exports.StateType = void 0;
const Account_1 = require("./Account");
const typeorm_1 = require("typeorm");
const Session_1 = require("./Session");
const Order_1 = require("./Order");
var StateType;
(function (StateType) {
    StateType[StateType["CREATED"] = 0] = "CREATED";
    StateType[StateType["COOKING"] = 1] = "COOKING";
    StateType[StateType["DELIVERING"] = 2] = "DELIVERING";
    StateType[StateType["FINISHED"] = 3] = "FINISHED";
    StateType[StateType["CANCELED"] = 4] = "CANCELED";
    StateType[StateType["CLOSED"] = 5] = "CLOSED";
})(StateType = exports.StateType || (exports.StateType = {}));
let State = class State {
    constructor(status, trigger) {
        this.statetype = status;
        this.created = new Date();
        this.history = false;
        this.triggerer = trigger;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], State.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], State.prototype, "created", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], State.prototype, "history", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-enum",
        enum: StateType,
    }),
    __metadata("design:type", Number)
], State.prototype, "statetype", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, (account) => account.triggered),
    __metadata("design:type", Account_1.Account)
], State.prototype, "triggerer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Order_1.Order, (order) => order.states),
    __metadata("design:type", Order_1.Order)
], State.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Session_1.Session, (session) => session.states),
    __metadata("design:type", Session_1.Session)
], State.prototype, "session", void 0);
State = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Number, Account_1.Account])
], State);
exports.State = State;
