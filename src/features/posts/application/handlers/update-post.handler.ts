import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '@features/posts/infrastructure/posts.repository';
import { UpdatePostDto } from '@features/posts/api/dto/input/update-post.input.dto';
import { NotFoundException } from '@nestjs/common';

export class UpdatePostCommand {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(private readonly postsRepository: PostsRepository) {}
  async execute(command: UpdatePostCommand): Promise<void> {
    const { id, title, shortDescription, content, blogId } = command;

    const data: UpdatePostDto = {
      title,
      shortDescription,
      content,
      blogId,
    };

    const isUpdated: boolean = await this.postsRepository.update(id, data);

    if (!isUpdated) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
  }
}
