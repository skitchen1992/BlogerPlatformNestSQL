import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SessionModelType } from '../domain/session-mongo.entity';
import { UpdateQuery } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Session } from '@features/session/domain/session.entity';
import { SessionDetails } from '@features/session/api/dto/SessionDetais';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: SessionModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async getSessionByDeviceId(
    deviceId: string,
  ): Promise<SessionDetails | null> {
    try {
      const devise = await this.dataSource.query(
        `
      SELECT * FROM sessions s
      WHERE s.device_id = $1
    `,
        [deviceId],
      );

      if (!devise.at(0)) {
        return null;
      }

      return devise.at(0);
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

  public async deleteSessionByDeviceId(deviceId: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `
        DELETE FROM sessions
        WHERE device_id = $1;
    `,
        [deviceId],
      );
      return result.at(1) === 1;
    } catch (e) {
      return false;
    }
  }

  async deleteSessionListByUserId(userId: string): Promise<boolean> {
    try {
      const deleteResult = await this.dataSource.query(
        `
  DELETE FROM sessions
  WHERE user_id = $1
  `,
        [userId],
      );

      console.log('deleteResult', deleteResult);

      return Boolean(deleteResult.at(1));
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

  public async updateDatesByDeviceId(
    deviceId: string,
    tokenExpirationDate: Date,
    lastActiveDate: Date,
  ): Promise<boolean> {
    try {
      const updateResult = await this.dataSource.query(
        `
      UPDATE sessions
      SET token_expiration_date = $1, 
            last_active_date = $2
      WHERE device_id = $3
      RETURNING id;
      `,
        [tokenExpirationDate, lastActiveDate, deviceId],
      );

      return Boolean(updateResult.at(1));
    } catch (e) {
      return false;
    }
  }
}
