import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentModelType } from '../domain/comment-mongo.entity';

import { Comment } from '../domain/comment.entity';
import { UpdateCommentDto } from '@features/comments/api/dto/input/update-comment.input.dto';
import { NewComment } from '@features/comments/api/dto/new-comment.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentsModel: CommentModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async getById(commentId: string): Promise<Comment | null> {
    try {
      const commentList: Comment[] = await this.dataSource.query(
        `
    SELECT *
    FROM comments c
    WHERE c.id = $1
    `,
        [commentId],
      );

      const comment = commentList.at(0);

      if (!comment) {
        return null;
      }

      return comment;
    } catch (e) {
      return null;
    }
  }

  public async create(newComment: NewComment): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO comments (content, user_id, user_login, post_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
        [
          newComment.content,
          newComment.userId,
          newComment.userLogin,
          newComment.postId,
        ],
      );

      return result[0].id;
    } catch (e) {
      console.error('Error inserting comment into database', {
        error: e,
      });
      return '';
    }
  }

  public async update(
    commentId: string,
    data: UpdateCommentDto,
  ): Promise<boolean> {
    try {
      const updateResult = await this.dataSource.query(
        `
      UPDATE comments
      SET content = $1 
      WHERE id = $2
      RETURNING id;
      `,
        [data.content, commentId],
      );

      return Boolean(updateResult.at(1));
    } catch (e) {
      console.error('Error updating comment into database', {
        error: e,
      });
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
