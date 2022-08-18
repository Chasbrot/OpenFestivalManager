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
exports.Table = void 0;
const typeorm_1 = require("typeorm");
const Session_1 = require("./Session");
const TableGroup_1 = require("./TableGroup");
let Table = class Table {
    constructor(name) {
        this.name = name;
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Table.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Table.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TableGroup_1.TableGroup, (tablegroup) => tablegroup.tables),
    __metadata("design:type", TableGroup_1.TableGroup)
], Table.prototype, "tablegroup", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Session_1.Session, (session) => session.table),
    __metadata("design:type", Array)
], Table.prototype, "sessions", void 0);
Table = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [String])
], Table);
exports.Table = Table;
