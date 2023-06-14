import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
} from "typeorm";
import { Station } from "./Station";
import { Order } from "./Order";
import { State } from "./State";
import { Bill } from "./Bill";
import { Session } from "./Session";

export enum AccountType {
  ADMIN,
  USER,
  STATION,
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    unique: true,
  })
  name: string;

  @Column({
    nullable: true,
    select: false, // Default not included in selects (find etc.)
  })
  hash: string;

  @Column({
    type: "simple-enum",
    enum: AccountType,
  })
  accounttype: AccountType;

  @Column({
    default: true
  })
  loginAllowed: boolean;

  @OneToMany(() => Station, (station) => station.id)
  responsiblefor: Station[];

  @OneToMany(() => Account, (order) => order.id)
  orders: Order[];

  @OneToMany(() => State, (state) => state.triggerer)
  triggered: State[];

  @OneToMany(() => Bill, (bill) => bill.cashier)
  bills: Bill[];

  @ManyToMany(() => Session, (session) => session.servers)
  sessions: Session[];
}
