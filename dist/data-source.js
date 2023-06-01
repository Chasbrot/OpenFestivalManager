"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ds = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
// Import Model
const Account_1 = require("./entity/Account");
const Station_1 = require("./entity/Station");
const Alert_1 = require("./entity/Alert");
const AlertType_1 = require("./entity/AlertType");
const TableGroup_1 = require("./entity/TableGroup");
const Table_1 = require("./entity/Table");
const Product_1 = require("./entity/Product");
const Category_1 = require("./entity/Category");
const Variation_1 = require("./entity/Variation");
const Ingredient_1 = require("./entity/Ingredient");
const Bill_1 = require("./entity/Bill");
const Order_1 = require("./entity/Order");
const PaymentMethod_1 = require("./entity/PaymentMethod");
const Session_1 = require("./entity/Session");
const State_1 = require("./entity/State");
const ProductIngredient_1 = require("./entity/ProductIngredient");
class ds {
    static async createADS(dbhost, port, user, password, dbname) {
        try {
            exports.AppDataSource = new typeorm_1.DataSource({
                type: "postgres",
                host: dbhost,
                port: Number(port),
                username: user,
                password: password,
                database: dbname,
                entities: [
                    Account_1.Account,
                    Station_1.Station,
                    Alert_1.Alert,
                    AlertType_1.AlertType,
                    Table_1.Table,
                    TableGroup_1.TableGroup,
                    Category_1.Category,
                    Product_1.Product,
                    Variation_1.Variation,
                    Ingredient_1.Ingredient,
                    Bill_1.Bill,
                    Order_1.Order,
                    PaymentMethod_1.PaymentMethod,
                    Session_1.Session,
                    State_1.State,
                    ProductIngredient_1.ProductIngredient,
                ],
                synchronize: true,
                logging: false,
            });
            await exports.AppDataSource.initialize()
                .then(() => {
                // here you can start to work with your database
                console.log("[server]: Database initialized");
            });
        }
        catch (err) {
            console.log("[server]: Create DataSource failed, " + err);
            return false;
        }
        return true;
    }
    static async createADSSQLite(dbfile) {
        try {
            console.log("Loading database file from: " + __dirname + dbfile);
            exports.AppDataSource = new typeorm_1.DataSource({
                type: "sqlite",
                database: __dirname + dbfile,
                entities: [
                    Account_1.Account,
                    Station_1.Station,
                    Alert_1.Alert,
                    AlertType_1.AlertType,
                    Table_1.Table,
                    TableGroup_1.TableGroup,
                    Category_1.Category,
                    Product_1.Product,
                    Variation_1.Variation,
                    Ingredient_1.Ingredient,
                    Bill_1.Bill,
                    Order_1.Order,
                    PaymentMethod_1.PaymentMethod,
                    Session_1.Session,
                    State_1.State,
                    ProductIngredient_1.ProductIngredient,
                ],
                synchronize: true,
                logging: false,
            });
            await exports.AppDataSource.initialize()
                .then(() => {
                // here you can start to work with your database
                console.log("[server]: Database initialized");
            });
        }
        catch (err) {
            console.log("[server]: Create DataSource failed, " + err);
            return false;
        }
        return true;
    }
    static async createADSFromFile() {
        return ds.createADS(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_SCHEMA);
    }
}
exports.ds = ds;
