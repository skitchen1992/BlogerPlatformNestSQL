import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostModelType } from '../domain/post-mongo.entity';
import { UpdatePostDto } from '@features/posts/api/dto/input/update-post.input.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Post } from '@features/posts/domain/post.entity';

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

  public async update(id: string, data: UpdatePostDto): Promise<boolean> {
    const updateResult = await this.postModel.updateOne({ _id: id }, data);

    return updateResult.modifiedCount === 1;
  }

  public async delete(id: string): Promise<boolean> {
    const deleteResult = await this.postModel.deleteOne({ _id: id });

    return deleteResult.deletedCount === 1;
  }
}
