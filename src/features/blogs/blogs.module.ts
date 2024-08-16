import { forwardRef, Module, Provider } from '@nestjs/common';
import { SharedModule } from '../../modules/shared.module';
import { BlogsRepository } from '@features/blogs/infrastructure/blogs.repository';
import { BlogsQueryRepository } from '@features/blogs/infrastructure/blogs.query-repository';
import { BlogsService } from '@features/blogs/application/blogs.service';
import { CreateBlogHandler } from '@features/blogs/application/handlers/create-blog.handler';
import { CreatePostForBlogHandler } from '@features/blogs/application/handlers/create-post-for-blog.handler';
import { UpdateBlogHandler } from '@features/blogs/application/handlers/update-blog.handler';
import { DeleteBlogHandler } from '@features/blogs/application/handlers/delete-blog.handler';
import { GetAllHandler } from '@features/blogs/application/handlers/get-all.handler';
import { GetPostForBlogHandler } from '@features/blogs/application/handlers/get-posts-for-blog.handler';
import { GetBlogHandler } from '@features/blogs/application/handlers/get-blog.handler';
import { BlogsController } from '@features/blogs/api/blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '@features/blogs/domain/blog.entity';
import { PostsModule } from '@features/posts/posts.module';
import { UsersModule } from '@features/users/users.module';

const blogsProviders: Provider[] = [
  BlogsRepository,
  BlogsQueryRepository,
  BlogsService,
  CreateBlogHandler,
  CreatePostForBlogHandler,
  UpdateBlogHandler,
  DeleteBlogHandler,
  GetAllHandler,
  GetPostForBlogHandler,
  GetBlogHandler,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    SharedModule,
    forwardRef(() => PostsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [...blogsProviders],
  controllers: [BlogsController],
  exports: [BlogsRepository, BlogsQueryRepository],
})
export class BlogsModule {}
