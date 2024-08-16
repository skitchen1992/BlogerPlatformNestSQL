import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '@features/comments/infrastructure/comments.repository';
import { Comment } from '@features/comments/domain/comment.entity';
import { getCurrentISOStringDate } from '@utils/dates';

export class CreateCommentCommand {
  constructor(
    public content: string,
    public userId: string,
    public userLogin: string,
    public postId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}
  async execute(command: CreateCommentCommand): Promise<string> {
    const { content, userId, userLogin, postId } = command;

    const newComment: Comment = {
      content,
      commentatorInfo: {
        userId,
        userLogin,
      },
      postId,
      createdAt: getCurrentISOStringDate(),
    };

    return await this.commentsRepository.create(newComment);
  }
}
