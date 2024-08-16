import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '@features/users/infrastructure/users.repository';
import { BadRequestException } from '@nestjs/common';
import { add, getCurrentISOStringDate } from '@utils/dates';
import { getUniqueId } from '@utils/utils';
import { User } from '@features/users/domain/user.entity';
import { SharedService } from '@infrastructure/servises/shared/shared.service';

export class RegistrationCommand {
  constructor(
    public login: string,
    public password: string,
    public email: string,
  ) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationHandler
  implements ICommandHandler<RegistrationCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sharedService: SharedService,
  ) {}
  async execute(command: RegistrationCommand): Promise<void> {
    const { login, password, email } = command;
    const { foundBy } = await this.usersRepository.getUserByLoginOrEmail(
      login,
      email,
    );

    if (foundBy) {
      throw new BadRequestException({
        message: 'User already exists',
        key: foundBy,
      });
    }

    const passwordHash = await this.sharedService.generatePasswordHash(
      password,
    );

    const confirmationCode = getUniqueId();

    const newUser: User = {
      login,
      password: passwordHash,
      email,
      createdAt: getCurrentISOStringDate(),
      emailConfirmation: {
        isConfirmed: false,
        confirmationCode,
        expirationDate: add(getCurrentISOStringDate(), { hours: 1 }),
      },
    };

    await this.usersRepository.create(newUser);

    await this.sharedService.sendRegisterEmail(email, confirmationCode);
  }
}
