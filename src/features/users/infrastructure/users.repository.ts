import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserDocument } from '@features/users/domain/user-mongo.entity';
import { User } from '@features/users/domain/user.entity';
import { CreateUserDto } from '@features/users/api/dto/input/create-user.input.dto';

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

  public async create(newUser: CreateUserDto): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO users (login, password, email, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
        [newUser.login, newUser.password, newUser.email, new Date()],
      );

      return result[0].id;
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
    user: UserDocument | null;
    foundBy: string | null;
  }> {
    // const user = await this.userModel
    //   .findOne({
    //     $or: [{ login }, { email }],
    //   })
    //   .lean();

    const user = null;

    if (!user) {
      return { user: null, foundBy: null };
    }

    //@ts-ignore
    const foundBy = user?.login === login ? 'login' : 'email';
    return { user, foundBy };
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
