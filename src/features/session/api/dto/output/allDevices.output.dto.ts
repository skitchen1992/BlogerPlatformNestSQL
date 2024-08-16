import { SessionDocument } from '@features/session/domain/session.entity';

export class AllDevicesOutputDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

// MAPPERS

export const AllDevicesOutputDtoMapper = (
  session: SessionDocument,
): AllDevicesOutputDto => {
  const outputDto = new AllDevicesOutputDto();

  outputDto.ip = session.ip;
  outputDto.title = session.title;
  outputDto.lastActiveDate = session.lastActiveDate;
  outputDto.deviceId = session.deviceId;

  return outputDto;
};
