import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateBlogDto } from './dto/input/create-blog.input.dto';
import { UsersQuery } from '@features/users/api/dto/output/user.output.pagination.dto';
import { UpdateBlogDto } from '@features/blogs/api/dto/input/update-blog.input.dto';
import { PostsQueryRepository } from '@features/posts/infrastructure/posts.query-repository';
import {
  PostOutputPaginationDto,
  PostQuery,
} from '@features/posts/api/dto/output/post.output.pagination.dto';
import { CreatePostForBlogDto } from '@features/blogs/api/dto/input/create-post-for-blog.input.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '@features/blogs/application/handlers/create-blog.handler';
import { CreatePostForBlogCommand } from '@features/blogs/application/handlers/create-post-for-blog.handler';
import { UpdateBlogCommand } from '@features/blogs/application/handlers/update-blog.handler';
import { DeleteBlogCommand } from '@features/blogs/application/handlers/delete-blog.handler';
import { GetAllQuery } from '@features/blogs/application/handlers/get-all.handler';
import { BlogOutputPaginationDto } from '@features/blogs/api/dto/output/blog.output.pagination.dto';
import { GetPostForBlogQuery } from '@features/blogs/application/handlers/get-posts-for-blog.handler';
import { GetBlogQuery } from '@features/blogs/application/handlers/get-blog.handler';
import { BasicAuthGuard } from '@infrastructure/guards/basic-auth-guard.service';
import { GetPostQuery } from '@features/posts/application/handlers/get-post.handler';
import { BearerTokenInterceptorGuard } from '@infrastructure/guards/bearer-token-interceptor-guard.service';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

// Tag для swagger
@SkipThrottle()
@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(@Query() query: UsersQuery) {
    return await this.queryBus.execute<GetAllQuery, BlogOutputPaginationDto>(
      new GetAllQuery(query),
    );
  }

  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() input: CreateBlogDto) {
    const { name, description, websiteUrl } = input;

    const createdBlogId: string = await this.commandBus.execute<
      CreateBlogCommand,
      string
    >(new CreateBlogCommand(name, description, websiteUrl));

    return await this.queryBus.execute<GetBlogQuery, PostOutputPaginationDto>(
      new GetBlogQuery(createdBlogId),
    );
  }

  @UseGuards(BearerTokenInterceptorGuard)
  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: PostQuery,
    @Req() request: Request,
  ) {
    const userId = request.currentUser?.id.toString();

    return await this.queryBus.execute<
      GetPostForBlogQuery,
      PostOutputPaginationDto
    >(new GetPostForBlogQuery(query, blogId, userId));
  }

  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() input: CreatePostForBlogDto,
  ) {
    const { title, shortDescription, content } = input;

    const createdPostId: string = await this.commandBus.execute<
      CreatePostForBlogCommand,
      string
    >(new CreatePostForBlogCommand(title, shortDescription, content, blogId));

    return await this.queryBus.execute<GetPostQuery, PostsQueryRepository>(
      new GetPostQuery(createdPostId),
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute<GetBlogQuery, PostOutputPaginationDto>(
      new GetBlogQuery(id),
    );
  }

  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() input: UpdateBlogDto) {
    const { name, description, websiteUrl } = input;

    await this.commandBus.execute<UpdateBlogCommand, void>(
      new UpdateBlogCommand(id, name, description, websiteUrl),
    );
  }

  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.commandBus.execute<DeleteBlogCommand, void>(
      new DeleteBlogCommand(id),
    );
  }
}
