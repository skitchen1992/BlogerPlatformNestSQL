import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '@features/users/infrastructure/users.repository';
import { User } from '@features/users/domain/user.entity';
import { UsersService } from '@features/users/application/users.service';
import { getCurrentISOStringDate } from '@utils/dates';

export class CreateUserCommand {
  constructor(
    public login: string,
    public password: string,
    public email: string,
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}
  async execute(command: CreateUserCommand): Promise<string> {
    const { login, password, email } = command;

    const passwordHash = await this.usersService.generatePasswordHash(password);

    const newUser: User = {
      login,
      password: passwordHash,
      email,
      createdAt: getCurrentISOStringDate(),
    };

    return await this.usersRepository.create(newUser);
  }
}
