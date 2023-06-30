// Copyright Michael Selinger 2023
import { Account } from './Account';
import { Product } from './Product';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, Double, ManyToMany, JoinTable, UsingJoinColumnIsNotAllowedError } from "typeorm"
import { Category } from "./Category";
import { Ingredient } from "./Ingredient";
import { Station } from "./Station";
import { Variation } from "./Variation";
import { State } from './State';
import { Session } from './Session';
import { Bill } from './Bill';

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Product, (product) => product.id)
    product: Product

    @ManyToOne(() => Account, (account) => account.orders)
    orderedBy: Account

    @ManyToOne(() => Variation, (variation) => variation.orders)
    variation: Variation

    @OneToMany(() => State, (state) => state.order)
    states: State[]

    @ManyToOne(() => Session, (session) => session.orders)
    session: Session

    @ManyToOne(() => Bill, (bill) => bill.orders)
    bill: Bill

    @Column({
        nullable: true
    })
    note: string

    

    @ManyToMany(() => Ingredient)
    @JoinTable({name: "order_ingredients"})
    orderedIngredients: Ingredient[]

    // Reference for API access
    currentState: State | null

   /**
    * Returns the current state
    */
    public getCurrentState(): State | null {
        let state = null;
        this.states.forEach((s) => {
            if (!s.history) {
                state= s;
            }
            
        });
        this.currentState = state;
        return state;
    }

}