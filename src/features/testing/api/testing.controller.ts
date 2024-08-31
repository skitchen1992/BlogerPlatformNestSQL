import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentModelType,
} from '@features/comments/domain/comment.entity';
import { Blog, BlogModelType } from '@features/blogs/domain/blog-mongo.entity';
import { Post, PostModelType } from '@features/posts/domain/post.entity';
import { User, UserModelType } from '@features/users/domain/user-mongo.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@SkipThrottle()
@Controller('testing')
export class TestingController {
  constructor(
    @InjectModel(Comment.name) private commentsModel: CommentModelType,
    @InjectModel(Blog.name) private blogModel: BlogModelType,
    @InjectModel(Post.name) private postModel: PostModelType,
    @InjectModel(User.name) private userModel: UserModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete() {
    await this.blogModel.deleteMany({});
    await this.postModel.deleteMany({});
    await this.userModel.deleteMany({});
    await this.commentsModel.deleteMany({});

    const tables = ['users']; // Список всех таблиц, которые нужно очистить

    for (const table of tables) {
      await this.dataSource.query(
        `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`,
      );
    }
  }
}
