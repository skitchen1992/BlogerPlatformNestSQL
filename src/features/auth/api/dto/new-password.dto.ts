export class NewPasswordDto {
  password: string;
  recoveryCode: {
    isUsed: boolean;
  };

  constructor() {
    this.recoveryCode = {
      isUsed: true,
    };
  }
}

// MAPPERS

export const NewPasswordDtoMapper = (password: string): NewPasswordDto => {
  const outputDto = new NewPasswordDto();

  outputDto.password = password;

  return outputDto;
};
