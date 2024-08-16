import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';
import { UpdateQuery } from 'mongoose';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: SessionModelType,
  ) {}

  public async getSessionByDeviceId(
    deviceId: string,
  ): Promise<SessionDocument | null> {
    try {
      const devise = await this.sessionModel
        .findOne({ deviceId: deviceId })
        .lean();

      if (!devise) {
        return null;
      }

      return devise;
    } catch (e) {
      return null;
    }
  }

  public async create(newSession: Session): Promise<string> {
    const insertResult = await this.sessionModel.insertMany([newSession]);

    return insertResult[0].id;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.sessionModel.deleteOne({ _id: id });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async deleteSessionByDeviceId(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.sessionModel.deleteOne({ deviceId: id });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  async deleteList(): Promise<boolean> {
    try {
      const deleteResult = await this.sessionModel.deleteMany({});
      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async update(
    id: string,
    data: UpdateQuery<Session>,
  ): Promise<boolean> {
    try {
      const updatedResult = await this.sessionModel.updateOne(
        { _id: id },
        data,
      );

      return updatedResult.matchedCount > 0;
    } catch (e) {
      return false;
    }
  }

  public async updateByDeviceId(
    deviceId: string,
    data: UpdateQuery<Session>,
  ): Promise<boolean> {
    try {
      const updatedResult = await this.sessionModel.updateOne(
        { deviceId: deviceId },
        data,
      );

      return updatedResult.matchedCount > 0;
    } catch (e) {
      return false;
    }
  }
}
