import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from "typeorm"
import { Session } from "./Session";
import { TableGroup } from './TableGroup';
@Entity()
export class Table {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(()=> TableGroup, (tablegroup)=>tablegroup.tables)
    tablegroup: TableGroup

    @OneToMany(() => Session, (session) => session.table)
    sessions: Session[]

    constructor(name: string) {
        this.name = name;
      }

}