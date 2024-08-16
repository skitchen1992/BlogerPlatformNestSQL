import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentModelType,
} from '@features/comments/domain/comment.entity';
import { Blog, BlogModelType } from '@features/blogs/domain/blog.entity';
import { Post, PostModelType } from '@features/posts/domain/post.entity';
import { User, UserModelType } from '@features/users/domain/user.entity';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('testing')
export class TestingController {
  constructor(
    @InjectModel(Comment.name) private commentsModel: CommentModelType,
    @InjectModel(Blog.name) private blogModel: BlogModelType,
    @InjectModel(Post.name) private postModel: PostModelType,
    @InjectModel(User.name) private userModel: UserModelType,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete() {
    await this.blogModel.deleteMany({});
    await this.postModel.deleteMany({});
    await this.userModel.deleteMany({});
    await this.commentsModel.deleteMany({});
  }
}
