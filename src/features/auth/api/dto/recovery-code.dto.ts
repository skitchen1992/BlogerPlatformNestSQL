export class RecoveryCodeDto {
  recoveryCode: {
    code?: string;
    isUsed?: boolean;
  };

  constructor() {
    this.recoveryCode = {};
  }
}

// MAPPERS

export const RecoveryCodeDtoMapper = (code: string): RecoveryCodeDto => {
  const outputDto = new RecoveryCodeDto();

  outputDto.recoveryCode.code = code;
  outputDto.recoveryCode.isUsed = false;

  return outputDto;
};
