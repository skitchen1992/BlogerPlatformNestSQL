import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '@features/posts/infrastructure/posts.repository';
import { BlogsRepository } from '@features/blogs/infrastructure/blogs.repository';
import { NotFoundException } from '@nestjs/common';
import { Post } from '@features/posts/domain/post.entity';

export class CreatePostCommand {
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostHandler
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}
  async execute(command: CreatePostCommand): Promise<string> {
    const { title, shortDescription, content, blogId } = command;

    const blog = await this.blogsRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${blogId} not found`);
    }

    const newPost: Post = {
      title,
      short_description: shortDescription,
      content,
      blog_id: blogId,
      blog_name: blog.name,
    };

    return await this.postsRepository.create(newPost);
  }
}
