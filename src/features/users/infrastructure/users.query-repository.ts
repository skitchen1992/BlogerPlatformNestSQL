import { Injectable } from '@nestjs/common';
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
    const {
      searchLoginTerm,
      searchEmailTerm,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = query;

    const validSortDirections = ['asc', 'desc'];
    const direction = validSortDirections.includes(sortDirection)
      ? sortDirection
      : 'desc';

    const validSortFields = ['created_at', 'login', 'email'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    const users = await this.dataSource.query(
      `
    SELECT
        u.id,
        u.login,
        u.password,
        u.email,
        u.created_at,
        rc.is_confirmed AS recovery_is_confirmed,
        rc.confirmation_code AS recovery_confirmation_code,
        rc.expiration_date AS recovery_expiration_date,
        ec.is_confirmed AS email_is_confirmed,
        ec.confirmation_code AS email_confirmation_code,
        ec.expiration_date AS email_expiration_date
    FROM
        users u
    LEFT JOIN
        email_confirmations ec ON u.id = ec.user_id
    LEFT JOIN
        recovery_codes rc ON u.id = rc.user_id
    WHERE
        ($1::text IS NULL OR u.login ~* $1)
        OR ($2::text IS NULL OR u.email ~* $2)
    ORDER BY
        ${sortField} ${direction}
    LIMIT $3
    OFFSET $4 * ($5 - 1);
    `,
      [
        searchLoginTerm ? `.*${searchLoginTerm}.*` : null, // $1
        searchEmailTerm ? `.*${searchEmailTerm}.*` : null, // $2
        pageSize, // $3 (LIMIT)
        pageSize, // $4 (OFFSET calculation)
        pageNumber, // $5 (used for OFFSET)
      ],
    );

    const totalCount = await this.dataSource.query(
      `
    SELECT COUNT(*)::int AS count
    FROM users u
    WHERE
        ($1::text IS NULL OR u.login ~* $1)
        OR ($2::text IS NULL OR u.email ~* $2);
    `,
      [
        searchLoginTerm ? `.*${searchLoginTerm}.*` : null, // $1
        searchEmailTerm ? `.*${searchEmailTerm}.*` : null, // $2
      ],
    );

    const userList = users.map((user) => UserOutputDtoMapper(user));

    return UserOutputPaginationDtoMapper(
      userList,
      totalCount.at(0).count,
      Number(pageSize),
      Number(pageNumber),
    );
  }
}
