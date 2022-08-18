import "reflect-metadata"
import { DataSource } from "typeorm"

// Import Model
import { Account } from "./entity/Account"
import { Station } from "./entity/Station"
import { Alert } from './entity/Alert';
import { AlertType } from './entity/AlertType';
import { TableGroup } from './entity/TableGroup';
import { Table } from './entity/Table';
import { Product } from './entity/Product';
import { Category } from './entity/Category';
import { Variation } from './entity/Variation';
import { Ingredient } from './entity/Ingredient';
import { Bill } from './entity/Bill';
import { Order } from './entity/Order';
import { PaymentMethod } from './entity/PaymentMethod';
import { Session } from './entity/Session';
import { State } from './entity/State';
import { ProductIngredient } from './entity/ProductIngredient';



export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "Pa..w0rd",
    database: "festivalmanager",
    entities: [Account, Station,
        Alert, AlertType, Table, TableGroup, Category,
        Product, Variation, Ingredient, Bill, Order,
        PaymentMethod, Session, State, ProductIngredient],
    synchronize: true,
    logging: false,
})
