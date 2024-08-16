import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Post } from '@features/posts/domain/post.entity';
import { PostsRepository } from '@features/posts/infrastructure/posts.repository';
import { NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '@features/blogs/infrastructure/blogs.repository';
import { getCurrentISOStringDate } from '@utils/dates';

export class CreatePostForBlogCommand {
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogHandler
  implements ICommandHandler<CreatePostForBlogCommand, string>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}
  async execute(command: CreatePostForBlogCommand): Promise<string> {
    const { title, shortDescription, content, blogId } = command;

    const blog = await this.blogsRepository.get(blogId);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${blogId} not found`);
    }

    const newPost: Post = {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
      createdAt: getCurrentISOStringDate(),
    };

    return await this.postsRepository.create(newPost);
  }
}
