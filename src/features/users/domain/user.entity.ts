import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { EmailConfirmation } from '@features/users/domain/emailConfirmation.entity';
import { RecoveryCode } from '@features/users/domain/recoveryCode.entity';
import { Session } from '@features/session/domain/session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'varchar', length: 10 })
  login: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: string;

  @OneToOne(() => EmailConfirmation, { nullable: true, cascade: true })
  @JoinColumn({ name: 'user_id' })
  emailConfirmation?: EmailConfirmation;

  @OneToOne(() => RecoveryCode, { nullable: true, cascade: true })
  @JoinColumn({ name: 'user_id' })
  recoveryCode?: RecoveryCode;

  @OneToMany(() => Session, (session) => session.user)
  sessions?: Session[];
}
