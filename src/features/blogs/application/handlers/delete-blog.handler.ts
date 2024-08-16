import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '@features/blogs/infrastructure/blogs.repository';
import { NotFoundException } from '@nestjs/common';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(command: DeleteBlogCommand): Promise<void> {
    const { id } = command;

    const isDeleted: boolean = await this.blogsRepository.delete(id);

    if (!isDeleted) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
  }
}
