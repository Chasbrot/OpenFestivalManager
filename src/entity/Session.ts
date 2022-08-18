import { Table } from './Table';
import { Account } from './Account';
import { Product } from './Product';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, Double, ManyToMany, JoinTable } from "typeorm"
import { Category } from "./Category";
import { Ingredient } from "./Ingredient";
import { Station } from "./Station";
import { Variation } from "./Variation";
import { State } from './State';
import { Order } from './Order';
import { Bill } from './Bill';

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => State, (state) => state.session)
    states: State[]

    @ManyToOne(() => Table, (table) => table.sessions)
    table: Table

    @OneToMany(() => Order, (order) => order.session)
    orders: Order[]

    @OneToMany(() => Bill, (bill) => bill.session)
    bills: Bill[]

    @ManyToMany(() => Account, (account) => account.sessions)
    @JoinTable({
        name: "account_sessions"
    })
    servers: Account[]

    constructor(t: Table) {
        this.table = t;
    }

    /**
 * Returns the current state
 */
    public getCurrentState(): State | null {
        let state = null;
        this.states.forEach((s) => {
            if (!s.history) {
                state = s;
            }

        });
        return state;
    }

}