import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Like,
  LikeDocument,
  LikeModelType,
  LikeStatusEnum,
  ParentTypeEnum,
} from '../domain/likes.entity';
import { UpdateQuery } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private likesModel: LikeModelType) {}

  public async create(like: Like): Promise<string> {
    const insertResult = await this.likesModel.insertMany([like]);

    return insertResult[0].id;
  }

  public async get(
    userId: string,
    commentId: string,
    parentType: ParentTypeEnum,
  ): Promise<LikeDocument | null> {
    try {
      const like = await this.likesModel
        .findOne({
          $and: [{ authorId: userId }, { parentId: commentId }, { parentType }],
        })
        .lean();

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

  public async update(id: string, data: UpdateQuery<Like>): Promise<boolean> {
    try {
      const updatedResult = await this.likesModel.updateOne(
        { _id: new ObjectId(id) },
        data,
      );

      return updatedResult.matchedCount > 0;
    } catch (e) {
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
