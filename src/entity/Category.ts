import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { Product } from './Product';

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Product, (product) => product.category)
    products: Product[]

    constructor(name: string) {
        this.name = name;
      }
}