import { SessionDocument } from '@features/session/domain/session-mongo.entity';
import { SessionDetails } from '@features/session/api/dto/SessionDetais';

export class AllDevicesOutputDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

// MAPPERS

export const AllDevicesOutputDtoMapper = (
  session: SessionDetails,
): AllDevicesOutputDto => {
  const outputDto = new AllDevicesOutputDto();

  outputDto.ip = session.ip;
  outputDto.title = session.title;
  outputDto.lastActiveDate = session.last_active_date.toISOString();
  outputDto.deviceId = session.device_id;

  return outputDto;
};
