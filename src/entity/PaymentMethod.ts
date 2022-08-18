import { Account } from './Account';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { Bill } from './Bill';

@Entity()
export class PaymentMethod {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({
        default: false
    })
    default: boolean

    @OneToMany(() => PaymentMethod, (bill) => bill.id)
    bills: Bill[]
}