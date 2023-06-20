// Copyright Michael Selinger 2023
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Table } from "./Table";

@Entity()
export class TableGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Table, (table) => table.tablegroup)
  tables: Table[];

  constructor(name: string) {
    this.name = name;
  }
}
