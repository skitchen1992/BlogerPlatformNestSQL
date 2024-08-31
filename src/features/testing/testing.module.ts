import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '@features/posts/domain/post-mongo.entity';
import { TestingController } from '@features/testing/api/testing.controller';
import {
  Session,
  SessionSchema,
} from '@features/session/domain/session-mongo.entity';
import {
  Comment,
  CommentSchema,
} from '@features/comments/domain/comment.entity';
import { Blog, BlogSchema } from '@features/blogs/domain/blog-mongo.entity';
import { User, UserSchema } from '@features/users/domain/user-mongo.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [],
  controllers: [TestingController],
  exports: [],
})
export class TestingModule {}
