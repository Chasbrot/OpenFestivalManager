import { AlertType } from './AlertType';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn } from "typeorm"
import { Station } from './Station';

@Entity()
export class Alert {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    active: boolean

    @CreateDateColumn()
    triggered: Date

    @ManyToOne(()=> Alert, (alert)=>alert.alerttype)
    alerttype: AlertType

    @ManyToOne(() => Station, (station) => station.id)
    station: Station

    constructor(at: AlertType, s: Station) {
        this.active = true;
        this.triggered = new Date();
        this.alerttype = at;
        this.station = s;
      }

}