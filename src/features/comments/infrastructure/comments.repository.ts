import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { UpdateCommentDto } from '@features/comments/api/dto/input/update-comment.input.dto';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentsModel: CommentModelType,
  ) {}

  public async get(id: string): Promise<CommentDocument | null> {
    try {
      const comment = await this.commentsModel.findById(id).lean();

      if (!comment) {
        return null;
      }

      return comment;
    } catch (e) {
      return null;
    }
  }

  public async create(newComment: Comment): Promise<string> {
    const insertResult = await this.commentsModel.insertMany([newComment]);

    return insertResult[0].id;
  }

  public async update(id: string, data: UpdateCommentDto): Promise<boolean> {
    try {
      const updateResult = await this.commentsModel.updateOne(
        { _id: id },
        data,
      );

      return updateResult.modifiedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.commentsModel.deleteOne({ _id: id });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }
}
