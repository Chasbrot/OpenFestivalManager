// Copyright Michael Selinger 2023
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, Double } from "typeorm"
import { Category } from "./Category";
import { Order } from "./Order";
import { Product } from "./Product";
import { Station } from "./Station";

@Entity()
export class Variation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    attrname: string

    @Column({type: "decimal", precision: 10, scale: 2, default: 0})
    price: number

    @ManyToOne(()=> Product, (product)=> product.variations)
    product: Product

    @OneToMany(() => Order, (order) => order.variation)
    orders: Order[]


    constructor(name: string, price: number, parent: Product) {
        this.attrname = name;
        this.price = price;
        this.product = parent;
      }

}