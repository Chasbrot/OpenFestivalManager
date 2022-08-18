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
exports.Bill = void 0;
const Session_1 = require("./Session");
const Account_1 = require("./Account");
const typeorm_1 = require("typeorm");
const PaymentMethod_1 = require("./PaymentMethod");
const Order_1 = require("./Order");
let Bill = class Bill {
    getValue() {
        let v = 0;
        this.orders.forEach((o) => {
            if (o.variation) {
                v += Number(o.variation.price);
            }
            else {
                v += Number(o.product.price);
            }
        });
        return v;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Bill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Bill.prototype, "paymentTime", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, (order) => order.bill),
    __metadata("design:type", Array)
], Bill.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PaymentMethod_1.PaymentMethod, (paymentmethod) => paymentmethod.bills),
    __metadata("design:type", PaymentMethod_1.PaymentMethod)
], Bill.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, (account) => account.bills),
    __metadata("design:type", Account_1.Account)
], Bill.prototype, "cashier", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Session_1.Session, (session) => session.bills),
    __metadata("design:type", Session_1.Session)
], Bill.prototype, "session", void 0);
Bill = __decorate([
    (0, typeorm_1.Entity)()
], Bill);
exports.Bill = Bill;
