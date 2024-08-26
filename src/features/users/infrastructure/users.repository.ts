import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '@features/users/domain/user.entity';
import { UserDocument } from '@features/users/domain/user-mongo.entity';
import { EmailConfirmation } from '@features/users/domain/emailConfirmation.entity';
import { RecoveryCodeDto } from '@features/auth/api/dto/recovery-code.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  public async get(userId: string): Promise<UserDocument | null> {
    try {
      //const user = await this.userModel.findById(userId).lean();
      const user = null;

      if (!user) {
        return null;
      }

      return user;
    } catch (e) {
      return null;
    }
  }

  public async create(
    newUser: User,
    emailConfirmation?: EmailConfirmation,
  ): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO users (login, password, email, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
        [newUser.login, newUser.password, newUser.email, new Date()],
      );

      const userId = result[0].id;

      if (emailConfirmation) {
        await this.dataSource.query(
          `
      INSERT INTO email_confirmations (user_id, is_confirmed, confirmation_code, expiration_date)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
          [
            userId,
            emailConfirmation.is_confirmed,
            emailConfirmation.confirmation_code,
            emailConfirmation.expiration_date,
          ],
        );
      }

      return userId;
    } catch (e) {
      console.error('Error inserting user into database', {
        error: e,
      });
      return '';
    }
  }

  public async delete(userId: string): Promise<boolean> {
    try {
      await this.dataSource.query(
        `
        DELETE from users 
        WHERE id = $1
    `,
        [userId],
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  public async update(id: string, data: UpdateQuery<User>): Promise<boolean> {
    try {
      // const updatedResult = await this.userModel.updateOne({ _id: id }, data);

      return false;
    } catch (e) {
      return false;
    }
  }

  public async insertRecoveryCode(
    userId: string,
    recoveryCodeDto: RecoveryCodeDto,
  ): Promise<boolean> {
    try {
      // Попытка обновления записи с указанным user_id
      const updateResult = await this.dataSource.query(
        `
      UPDATE recovery_code
      SET confirmation_code = $1, is_confirmed = $2
      WHERE user_id = $3
      RETURNING id;
      `,
        [recoveryCodeDto.confirmationCode, recoveryCodeDto.isConfirmed, userId],
      );

      // Если запись обновлена, возвращаем true
      if (Boolean(updateResult.at(1))) {
        return true;
      }

      // Если запись не была найдена и обновлена, вставляем новую запись
      const insertResult = await this.dataSource.query(
        `
      INSERT INTO recovery_code (user_id, confirmation_code, is_confirmed)
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
        [userId, recoveryCodeDto.confirmationCode, recoveryCodeDto.isConfirmed],
      );

      return Boolean(insertResult.length);
    } catch (e) {
      return false;
    }
  }

  public async updateUserFieldById(
    id: string,
    field: string,
    data: unknown,
  ): Promise<boolean> {
    try {
      // const updateResult = await this.userModel.updateOne(
      //   { _id: id },
      //   { $set: { [field]: data } },
      // );

      return false;
    } catch (e) {
      return false;
    }
  }

  public async isLoginExist(login: string): Promise<boolean> {
    const isLogin = await this.dataSource.query(
      ` 
    select 1 from users u
    where login = $1
    `,
      [login],
    );

    return Boolean(isLogin.at(0));
  }

  public async isEmailExist(email: string): Promise<boolean> {
    const isExist = await this.dataSource.query(
      ` 
    select 1 from users u
    where email = $1
    `,
      [email],
    );

    return Boolean(isExist.at(0));
  }

  public async getUserByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<{
    user: User | null;
    foundBy: string | null;
  }> {
    const user = await this.dataSource.query(
      `
    SELECT
        u.id,
        u.login,
        u.password,
        u.email,
        u.created_at,
        rc.is_confirmed AS recovery_is_confirmed,
        rc.confirmation_code AS recovery_confirmation_code,
        ec.is_confirmed AS email_is_confirmed,
        ec.confirmation_code AS email_confirmation_code,
        ec.expiration_date AS email_expiration_date
    FROM
        users u
    LEFT JOIN
        email_confirmations ec ON u.id = ec.user_id
    LEFT JOIN
        recovery_code rc ON u.id = rc.user_id
     WHERE u.login = $1 OR u.email = $2
    `,
      [
        login, //$1
        email, //$2
      ],
    );

    if (!Boolean(user.length)) {
      return { user: null, foundBy: null };
    }

    const foundBy = user.at(0)?.login === login ? 'login' : 'email';
    return { user: user.at(0), foundBy };
  }

  public async getUserByConfirmationCode(
    code: string,
  ): Promise<UserDocument | null> {
    // const user = await this.userModel
    //   .findOne({
    //     'emailConfirmation.confirmationCode': code,
    //   })
    //   .lean();
    const user = null;

    if (!user) {
      return null;
    }

    return user;
  }
}
