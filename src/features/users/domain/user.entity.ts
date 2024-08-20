import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EmailConfirmation } from '@features/users/domain/emailConfirmation.entity';
import { RecoveryCode } from '@features/users/domain/recoveryCode.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar', length: 10 })
  login: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', default: () => 'NOW' })
  created_at: string;

  @OneToOne(() => EmailConfirmation, { nullable: true, cascade: true })
  @JoinColumn()
  emailConfirmation?: EmailConfirmation;

  @OneToOne(() => RecoveryCode, { nullable: true, cascade: true })
  @JoinColumn()
  recoveryCode?: RecoveryCode;
}
