import { Injectable } from '@nestjs/common';
import { Session, SessionModelType } from '../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { getCurrentISOStringDate } from '@utils/dates';
import { AllDevicesOutputDtoMapper } from '@features/session/api/dto/output/allDevices.output.dto';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: SessionModelType,
  ) {}

  async getDeviceListByUserId(userId: string) {
    const filters = {
      userId,
      tokenExpirationDate: { $gt: getCurrentISOStringDate() },
    };

    const sessionList = await this.sessionModel.find(filters).lean();

    return sessionList.map((session) => AllDevicesOutputDtoMapper(session));
  }
}
