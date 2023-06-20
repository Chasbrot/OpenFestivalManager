// Copyright Michael Selinger 2023
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, Double, ManyToMany, JoinTable } from "typeorm"
import { Ingredient } from "./Ingredient";
import { Product } from "./Product";
@Entity()
export class ProductIngredient {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    optional: boolean

    @ManyToOne(()=> Product, (product)=>product.ingredients, {
      eager: true // If someone loads this class, always load opposite side
    })
    product: Product
  
    @ManyToOne(() => Ingredient, (ingredient) => ingredient.products, {
      eager: true // If someone loads this class, always load opposite side
    })
    ingredient: Ingredient

    constructor(p: Product, i: Ingredient, opt: boolean) {
      this.product = p;
      this.ingredient = i;
      this.optional = opt;
      }
}