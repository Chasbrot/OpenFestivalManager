import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from "typeorm"
import { Account } from './Account';
import { Product } from "./Product";

@Entity()
export class Station {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 100,
    })
    name: string

    @ManyToOne(()=> Account, (account)=>account.responsiblefor)
    responsible: Account

    @OneToMany(() => Station, (product) => product.id)
    products: Product[]

    constructor(name: string) {
        this.name = name;
    }

}