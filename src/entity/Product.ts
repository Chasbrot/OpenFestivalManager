import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Double,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Category } from "./Category";
import { Ingredient } from "./Ingredient";
import { Station } from "./Station";
import { Variation } from "./Variation";
import { ProductIngredient } from "./ProductIngredient";

export enum LockType {
  NONE = 0, // Product is available for ordering
  TEMPORARY = 1, // Product is temporarly not available for ordering
  INFINITE = 2, // Product is not available for a longer period
  HIDDEN = 3, // Product is hidden and not available
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price: number;

  @Column()
  deliverable: boolean;

  @Column({
    default: 0,
  })
  list_priority: number;

  @Column({
    default: LockType.NONE,
  })
  productLock: LockType;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  category: Category | null;

  @ManyToOne(() => Station, (station) => station.products)
  producer: Station;

  @OneToMany(() => Variation, (variation) => variation.product)
  variations: Variation[];

  @OneToMany(() => ProductIngredient, (ingredient) => ingredient.product)
  ingredients: ProductIngredient[];

  constructor(name: string, price: number, deliverable: boolean) {
    this.name = name;
    this.price = price;
    this.deliverable = deliverable;
  }
}
