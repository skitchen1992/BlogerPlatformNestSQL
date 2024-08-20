import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recovery_codes')
export class RecoveryCode {
  @PrimaryGeneratedColumn()
  user_id: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'boolean' })
  isUsed: boolean;
}
