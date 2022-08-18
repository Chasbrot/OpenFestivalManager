import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, Double, ManyToMany, JoinTable } from "typeorm"
import { Category } from "./Category";
import { Ingredient } from "./Ingredient";
import { Station } from "./Station";
import { Variation } from "./Variation";
import { ProductIngredient } from './ProductIngredient';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({type: "decimal", precision: 10, scale: 2, default: 0})
    price: number

    @Column()
    deliverable: boolean

    @Column()
    list_priority: number

    @ManyToOne(() => Category, (category) => category.products)
    category: Category

    @ManyToOne(()=> Station, (station)=>station.products)
    producer: Station

    @OneToMany(() => Variation, (variation) => variation.product)
    variations: Variation[];

    @OneToMany(()=> ProductIngredient, (ingredient)=> ingredient.product)
    ingredients: ProductIngredient[];

    constructor(name: string, price: number, deliverable: boolean) {
        this.name = name;
        this.price = price;
        this.deliverable = deliverable;
      }


}