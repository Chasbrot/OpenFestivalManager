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
var Alert_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = void 0;
// Copyright Michael Selinger 2023
const AlertType_1 = require("./AlertType");
const typeorm_1 = require("typeorm");
const Station_1 = require("./Station");
let Alert = Alert_1 = class Alert {
    constructor(at, s) {
        this.active = true;
        this.triggered = new Date();
        this.alerttype = at;
        this.station = s;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Alert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Alert.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "triggered", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Alert_1, (alert) => alert.alerttype),
    __metadata("design:type", AlertType_1.AlertType)
], Alert.prototype, "alerttype", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Station_1.Station, (station) => station.id),
    __metadata("design:type", Station_1.Station)
], Alert.prototype, "station", void 0);
Alert = Alert_1 = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [AlertType_1.AlertType, Station_1.Station])
], Alert);
exports.Alert = Alert;
