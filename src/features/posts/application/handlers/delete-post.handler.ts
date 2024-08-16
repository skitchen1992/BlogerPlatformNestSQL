import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '@features/posts/infrastructure/posts.repository';
import { NotFoundException } from '@nestjs/common';

export class DeletePostCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(private readonly postsRepository: PostsRepository) {}
  async execute(command: DeletePostCommand): Promise<void> {
    const { id } = command;

    const isDeleted: boolean = await this.postsRepository.delete(id);

    if (!isDeleted) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
  }
}
