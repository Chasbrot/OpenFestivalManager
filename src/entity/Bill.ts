// Copyright Michael Selinger 2023
import { Session } from './Session';
import { Account } from './Account';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from "typeorm"
import { PaymentMethod } from './PaymentMethod';
import { Order } from './Order';
import { brotliCompress } from 'zlib';

@Entity()
export class Bill {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    paymentTime: Date

    @OneToMany(() => Order, (order) => order.bill)
    orders: Order[]

    @ManyToOne(() => PaymentMethod, (paymentmethod) => paymentmethod.bills)
    method: PaymentMethod

    @ManyToOne(() => Account, (account) => account.bills)
    cashier: Account

    @ManyToOne(() => Session, (session) => session.bills)
    session: Session

    public getValue():number{
        let v=0;
        this.orders.forEach((o)=>{
            if(o.variation){
                v += Number(o.variation.price);
            }else{
                v += Number(o.product.price);
            }
        });
        return v;
    }

}