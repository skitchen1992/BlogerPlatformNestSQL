import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_confirmations')
export class EmailConfirmation {
  @PrimaryGeneratedColumn()
  user_id: string;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'varchar' })
  confirmationCode: string;

  @Column({ type: 'timestamp with local time zone' })
  expirationDate: Date;
}
