import { Injectable } from '@nestjs/common';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserOutputDto,
  UserOutputDtoMapper,
} from '../api/dto/output/user.output.dto';
import { Pagination } from '@base/models/pagination.base.model';
import {
  UsersQuery,
  UserOutputPaginationDto,
  UserOutputPaginationDtoMapper,
} from '@features/users/api/dto/output/user.output.pagination.dto';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
    private readonly pagination: Pagination,
  ) {}

  public async getById(userId: string): Promise<UserOutputDto | null> {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      return null;
    }

    return UserOutputDtoMapper(user);
  }

  public async getAll(query: UsersQuery): Promise<UserOutputPaginationDto> {
    const pagination = this.pagination.getUsers(query);

    const users = await this.userModel
      .find(pagination.query)
      .sort(pagination.sort)
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount = await this.userModel.countDocuments(pagination.query);

    const userList = users.map((user) => UserOutputDtoMapper(user));

    return UserOutputPaginationDtoMapper(
      userList,
      totalCount,
      pagination.pageSize,
      pagination.page,
    );
  }

  public async getUserByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<{
    user: UserDocument | null;
    foundBy: string | null;
  }> {
    const user = await this.userModel
      .findOne({
        $or: [{ login }, { email }],
      })
      .lean();

    if (!user) {
      return { user: null, foundBy: null };
    }

    const foundBy = user.login === login ? 'login' : 'email';
    return { user, foundBy };
  }

  public async getUserByConfirmationCode(
    code: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({
        'emailConfirmation.confirmationCode': code,
      })
      .lean();

    if (!user) {
      return null;
    }

    return user;
  }

  public async updateUserFieldById(
    id: string,
    field: string,
    data: unknown,
  ): Promise<boolean> {
    const updateResult = await this.userModel.updateOne(
      { _id: id },
      { $set: { [field]: data } },
    );

    return updateResult.modifiedCount === 1;
  }

  public async isLoginExist(login: string): Promise<boolean> {
    const user = await this.userModel.findOne({ login: login }).lean();
    return !user;
  }

  public async isEmailExist(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email: email }).lean();

    return !user;
  }
  public async isUserExist(login: string, email: string): Promise<boolean> {
    const user = await this.userModel
      .findOne({
        $or: [{ login }, { email }],
      })
      .lean();

    return !!user;
  }
}
