import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
} from "typeorm";
import { Order } from "./Order";
import { ProductIngredient } from './ProductIngredient';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(()=> ProductIngredient, (productingredient)=> productingredient.ingredient)
  products: ProductIngredient[];


  constructor(name: string) {
    this.name = name;
  }
}
