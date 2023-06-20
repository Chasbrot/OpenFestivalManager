// Copyright Michael Selinger 2023
import { Alert } from "./Alert";
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";

@Entity()
export class AlertType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => AlertType, (alert) => alert.id)
  accounts: Alert[];

  constructor(name: string) {
    this.name = name;
  }
}
