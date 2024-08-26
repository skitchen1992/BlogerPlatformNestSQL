import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SessionDocument,
  SessionModelType,
} from '../domain/session-mongo.entity';
import { UpdateQuery } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Session } from '@features/session/domain/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: SessionModelType,
    @InjectDataSource() private dataSource: DataSource,
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
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO sessions (user_id, ip, title, last_active_date, token_issue_date, token_expiration_date, device_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `,
        [
          newSession.user_id,
          newSession.ip,
          newSession.title,
          newSession.last_active_date,
          newSession.token_issue_date,
          newSession.token_expiration_date,
          newSession.device_id,
        ],
      );

      return result[0].id;
    } catch (e) {
      console.error('Error inserting user into database', {
        error: e,
      });
      return '';
    }
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
