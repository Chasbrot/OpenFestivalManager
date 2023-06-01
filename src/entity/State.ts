import { Request } from "express";
import { Table } from "./Table";
import { Account } from "./Account";
import { Product } from "./Product";
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
import { Session } from "./Session";
import { Order } from "./Order";

export enum StateType {
  CREATED,        // 0 Order or session was created
  COOKING,        // 1 Order is being processed by the station
  DELIVERING,     // 2 Order is currently being delivered
  FINISHED,       // 3 Order was finished
  CANCELED,       // 4 Order was canceled
  CLOSED,         // 5 Session was closed
}

@Entity()
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created: Date;

  @Column()
  history: boolean;

  @Column({
    type: "simple-enum",
    enum: StateType,
  })
  statetype: StateType;

  @ManyToOne(() => Account, (account) => account.triggered)
  triggerer: Account;

  @ManyToOne(() => Order, (order) => order.states)
  order: Order;

  @ManyToOne(() => Session, (session) => session.states)
  session: Session;

  constructor(status: StateType, trigger: Account) {
    this.statetype = status;
    this.created = new Date();
    this.history = false;
    this.triggerer = trigger;
  }
}
