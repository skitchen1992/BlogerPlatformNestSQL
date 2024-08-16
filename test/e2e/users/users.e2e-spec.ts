import request from 'supertest';
import { createAuthorizationHeader } from '../../utils/test-helpers';
import { apiSettings, app, mockUserModel } from '../../jest.setup';
import { HttpStatus } from '@nestjs/common';
import { testSeeder } from '../../utils/test.seeder';
import { UserOutputDtoMapper } from '@features/users/api/dto/output/user.output.dto';
import { getUniqueId } from '@utils/utils';
import { add, getCurrentISOStringDate } from '@utils/dates';
import { ObjectId } from 'mongodb';
import * as data from './dataset';
import { APP_PREFIX } from '@settings/apply-app-setting';
import { ID } from '../../mocks/mocks';

describe.skip('Users (e2e) GET', () => {
  it('Should return users list with pagination metadata', async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(1),
    );

    const response = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      items: userList.map(UserOutputDtoMapper),
      totalCount: 1,
      pageSize: 10,
      page: 1,
      pagesCount: 1,
    });
  });

  it('Should return users list with pagination metadata second page', async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const response = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/users/?pageSize=1&pageNumber=2`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      items: [expect.objectContaining(UserOutputDtoMapper(userList[1]))],
      totalCount: 3,
      pageSize: 1,
      page: 2,
      pagesCount: 3,
    });
  });

  it('Should find user by login', async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const response = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/users/?searchLoginTerm=test0`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      items: [expect.objectContaining(UserOutputDtoMapper(userList[0]))],
      totalCount: 1,
      pageSize: 10,
      page: 1,
      pagesCount: 1,
    });
  });

  it('Should find user by email', async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const response = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/users/?searchEmailTerm=test0@gmail.com`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      items: [expect.objectContaining(UserOutputDtoMapper(userList[0]))],
      totalCount: 1,
      pageSize: 10,
      page: 1,
      pagesCount: 1,
    });
  });

  it('Should getById array by filters', async () => {
    const providedUsers = [
      { login: 'loSer', password: 'string', email: 'email2p@gg.om' },
      { login: 'log01', password: 'string', email: 'emai@gg.com' },
      { login: 'log02', password: 'string', email: 'email2p@g.com' },
      { login: 'uer15', password: 'string', email: 'emarrr1@gg.com' },
      { login: 'user01', password: 'string', email: 'email1p@gg.cm' },
      { login: 'user02', password: 'string', email: 'email1p@gg.com' },
      { login: 'user03', password: 'string', email: 'email1p@gg.cou' },
      { login: 'user05', password: 'string', email: 'email1p@gg.coi' },
      { login: 'usr-1-01', password: 'string', email: 'email3@gg.com' },
    ];

    function createUsersArray(
      users: Array<{ login: string; password: string; email: string }>,
    ): Array<any> {
      return users.map((user) => ({
        login: user.login,
        email: user.email,
        password: user.password,
        createdAt: getCurrentISOStringDate(),
        emailConfirmation: {
          confirmationCode: getUniqueId(),
          expirationDate: add(getCurrentISOStringDate(), { hours: 1 }),
          isConfirmed: true,
        },
        _id: new ObjectId(),
      }));
    }

    await mockUserModel.insertMany(createUsersArray(providedUsers));

    const response = await request(app.getHttpServer())
      .get(
        `${APP_PREFIX}/users/?pageSize=15&pageNumber=1&searchLoginTerm=seR&searchEmailTerm=.com&sortDirection=asc&sortBy=login`,
      )
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String), // Matches the _id field in the actual response
          login: 'loSer',
          email: 'email2p@gg.om',
          createdAt: expect.any(String), // Matches the createdAt field in the actual response
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'log01',
          email: 'emai@gg.com',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'log02',
          email: 'email2p@g.com',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'uer15',
          email: 'emarrr1@gg.com',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'user01',
          email: 'email1p@gg.cm',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'user02',
          email: 'email1p@gg.com',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'user03',
          email: 'email1p@gg.cou',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'user05',
          email: 'email1p@gg.coi',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: expect.any(String),
          login: 'usr-1-01',
          email: 'email3@gg.com',
          createdAt: expect.any(String),
        }),
      ]),
      totalCount: 9,
      pageSize: 15,
      page: 1,
      pagesCount: 1,
    });
  });
});

describe.skip('Users (e2e) POST', () => {
  it('Should add user', async () => {
    const user = testSeeder.createUserDto();

    const response = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(user)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      id: expect.any(String),
      login: user.login,
      email: user.email,
      createdAt: expect.any(String),
    });
  });

  it('Should getById Error while field "login" is too short', async () => {
    const response = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewUser1)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual(data.errorDataSet1);
  });

  it('Should getById Error while field "password" is too long', async () => {
    const response = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewUser2)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual(data.errorDataSet2);
  });

  it('Should getById Error while field "password" is too long', async () => {
    const response = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewUser3)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual(data.errorDataSet3);
  });
});

describe.skip('Users (e2e) DELETE', () => {
  it('Should deletePost user', async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(2),
    );

    const userId = userList[0]._id.toString();

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/users/${userId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`Should get error ${HttpStatus.NOT_FOUND}`, async () => {
    await mockUserModel.insertMany(testSeeder.createUserListDto(2));

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/users/${ID}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NOT_FOUND);
  });
});
