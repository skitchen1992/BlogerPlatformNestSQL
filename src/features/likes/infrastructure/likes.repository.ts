import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LikeModelType } from '../domain/likes-mongo.entity';
import { Like, LikeStatusEnum, ParentTypeEnum } from '../domain/likes.entity';
import { ObjectId } from 'mongodb';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NewLikeDto } from '@features/likes/api/dto/new-like.dto';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel(Like.name) private likesModel: LikeModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async create(like: NewLikeDto): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO likes (status, author_id, parent_id, parent_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
        [like.status, like.authorId, like.parentId, like.parentType],
      );

      return result[0].id;
    } catch (e) {
      console.error('Error inserting like into database', {
        error: e,
      });
      return '';
    }
  }

  public async get(
    userId: string,
    parentId: string,
    parentType: ParentTypeEnum,
  ): Promise<Like | null> {
    try {
      const likeList = await this.dataSource.query(
        `
    SELECT *
    FROM likes l
    WHERE l.author_id = $1 AND l.parent_id = $2 AND l.parent_type = $3
    `,
        [userId, parentId, parentType],
      );

      const like = likeList.at(0);

      if (!like) {
        return null;
      }
      return like;
    } catch (e) {
      return null;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.likesModel.deleteOne({
        _id: new ObjectId(id),
      });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async update(
    likeId: string,
    likeStatus: LikeStatusEnum,
  ): Promise<boolean> {
    try {
      const updateResult = await this.dataSource.query(
        `
      UPDATE likes
      SET status = $2 
      WHERE id = $1
      RETURNING id;
      `,
        [likeId, likeStatus],
      );

      return Boolean(updateResult.at(1));
    } catch (e) {
      console.error('Error updating like into database', {
        error: e,
      });
      return false;
    }
  }

  public async getLikeDislikeCounts(
    commentId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    const result = await this.likesModel.aggregate([
      { $match: { parentId: commentId, parentType: ParentTypeEnum.COMMENT } },
      {
        $group: {
          _id: null,
          likesCount: {
            $sum: { $cond: [{ $eq: ['$status', LikeStatusEnum.LIKE] }, 1, 0] },
          },
          dislikesCount: {
            $sum: {
              $cond: [{ $eq: ['$status', LikeStatusEnum.DISLIKE] }, 1, 0],
            },
          },
        },
      },
    ]);

    return result.length ? result[0] : { likesCount: 0, dislikesCount: 0 };
  }
  public async getUserLikeStatus(
    commentId: string,
    userId: string,
  ): Promise<LikeStatusEnum> {
    const user = await this.likesModel
      .findOne({
        parentId: commentId,
        parentType: ParentTypeEnum.COMMENT,
        authorId: userId,
      })
      .lean();

    return user?.status || LikeStatusEnum.NONE;
  }
}
