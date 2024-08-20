import { Injectable } from '@nestjs/common';
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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private readonly pagination: Pagination,
  ) {}

  public async getById(userId: string): Promise<UserOutputDto | null> {
    const user = await this.dataSource.query(
      `
SELECT  u.id, 
        u.login, 
        u.password, 
        u.email, 
        u.created_at,
        rc.is_confirmed AS recovery_is_confirmed,
        rc.confirmation_code AS recovery_confirmation_code,
        rc.expiration_date AS recovery_expiration_date,
        ec.is_confirmed AS email_is_confirmed,
        ec.confirmation_code AS email_confirmation_code,
        ec.expiration_date AS email_expiration_date FROM users u 
LEFT join email_confirmations ec ON u.id = ec.user_id 
LEFT join recovery_codes rc ON u.id = rc.user_id
where u.id = $1
    `,
      [userId],
    );

    if (!Boolean(user.length)) {
      return null;
    }

    return UserOutputDtoMapper(user.at(0));
  }

  public async getAll(query: UsersQuery): Promise<UserOutputPaginationDto> {
    const pagination = this.pagination.getUsers(query);

    // const users = await this.userModel
    //   .find(pagination.query)
    //   .sort(pagination.sort)
    //   .skip(pagination.skip)
    //   .limit(pagination.pageSize)
    //   .lean();
    const users = [];

    const totalCount = 0;

    // @ts-ignore
    const userList = users.map((user) => UserOutputDtoMapper(user));

    return UserOutputPaginationDtoMapper(
      userList,
      totalCount,
      pagination.pageSize,
      pagination.page,
    );
  }
}
