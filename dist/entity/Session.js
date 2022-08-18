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
exports.Session = void 0;
const Table_1 = require("./Table");
const Account_1 = require("./Account");
const typeorm_1 = require("typeorm");
const State_1 = require("./State");
const Order_1 = require("./Order");
const Bill_1 = require("./Bill");
let Session = class Session {
    constructor(t) {
        this.table = t;
    }
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
        return state;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Session.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => State_1.State, (state) => state.session),
    __metadata("design:type", Array)
], Session.prototype, "states", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Table_1.Table, (table) => table.sessions),
    __metadata("design:type", Table_1.Table)
], Session.prototype, "table", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, (order) => order.session),
    __metadata("design:type", Array)
], Session.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Bill_1.Bill, (bill) => bill.session),
    __metadata("design:type", Array)
], Session.prototype, "bills", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Account_1.Account, (account) => account.sessions),
    (0, typeorm_1.JoinTable)({
        name: "account_sessions"
    }),
    __metadata("design:type", Array)
], Session.prototype, "servers", void 0);
Session = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Table_1.Table])
], Session);
exports.Session = Session;
