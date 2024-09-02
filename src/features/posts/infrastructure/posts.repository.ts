import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostModelType } from '../domain/post-mongo.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Post } from '@features/posts/domain/post.entity';
import { IUpdatePostDto } from '@features/posts/api/dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: PostModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async create(newPost: Post): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO posts (title, short_description, content, blog_id, blog_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `,
        [
          newPost.title,
          newPost.short_description,
          newPost.content,
          newPost.blog_id,
          newPost.blog_name,
        ],
      );

      return result[0].id;
    } catch (e) {
      console.error('Error inserting post into database', {
        error: e,
      });
      return '';
    }
  }

  public async update(
    postId: string,
    blogId: string,
    data: IUpdatePostDto,
  ): Promise<boolean> {
    try {
      const updateResult = await this.dataSource.query(
        `
      UPDATE posts
      SET title = $1, 
          short_description = $2,
          content = $3
      WHERE id = $5 AND blog_id = $4
      RETURNING id;
      `,
        [data.title, data.shortDescription, data.content, blogId, postId],
      );

      return Boolean(updateResult.at(1));
    } catch (e) {
      console.error('Error updating post into database', {
        error: e,
      });
      return false;
    }
  }

  public async delete(id: string): Promise<boolean> {
    const deleteResult = await this.postModel.deleteOne({ _id: id });

    return deleteResult.deletedCount === 1;
  }
}
