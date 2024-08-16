import { UserDocument } from '../../../domain/user.entity';

export class UserOutputDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

// MAPPERS

export const UserOutputDtoMapper = (user: UserDocument): UserOutputDto => {
  const outputDto = new UserOutputDto();

  outputDto.id = user._id.toString();
  outputDto.login = user.login;
  outputDto.email = user.email;
  outputDto.createdAt = user.createdAt;

  return outputDto;
};
