import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@features/users/domain/user.entity';

export enum LikeStatusEnum {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None',
}

export enum ParentTypeEnum {
  POST = 'Post',
  COMMENT = 'Comment',
}
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 10, default: 'None' })
  status: LikeStatusEnum;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'uuid' })
  parentId: string;

  @Column({ type: 'varchar', length: 10 })
  parentType: ParentTypeEnum;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;
}
