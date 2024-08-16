import { createAuthorizationHeader } from '../../utils/test-helpers';
import { apiSettings, app, jwtService, mockUserModel } from '../../jest.setup';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { APP_PREFIX } from '@settings/apply-app-setting';
import { testSeeder } from '../../utils/test.seeder';

describe(`Endpoint (POST) - /login`, () => {
  it(`Should get status ${HttpStatus.NO_CONTENT}`, async () => {
    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login: 'login',
        password: 'password',
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        loginOrEmail: 'login',
        password: 'password',
      })
      .expect(HttpStatus.OK);
  });

  it(`Should get status ${HttpStatus.UNAUTHORIZED}`, async () => {
    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login: 'login',
        password: 'password',
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        loginOrEmail: 'logi',
        password: 'password',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it(`Should get status ${HttpStatus.BAD_REQUEST}`, async () => {
    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login: 'l',
        password: 'password',
        email: 'example@example.com',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });
});

describe(`Endpoint (POST) - /registration`, () => {
  it(`Should get status ${HttpStatus.NO_CONTENT}`, async () => {
    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/registration`)
      .send({
        login: 'login',
        password: 'password',
        email: 'example@example.com',
      })
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`Should get status ${HttpStatus.BAD_REQUEST}`, async () => {
    // const data = testSeeder.createUserDto();
    //
    // await userService.createUser(data);

    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const user = userList[0];

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/registration`)
      .send({
        login: user.login,
        password: user.password,
        email: user.email,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual({
      errorsMessages: [
        {
          message: 'User already exists',
          field: 'login',
        },
      ],
    });
  });
});

describe(`Endpoint (POST) - /password-recovery`, () => {
  it(`Should get status ${HttpStatus.NO_CONTENT}`, async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const user = userList[0];

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/password-recovery`)
      .send({
        email: user.email,
      })
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`Should get status ${HttpStatus.BAD_REQUEST}`, async () => {
    await mockUserModel.insertMany(testSeeder.createUserListDto(3));

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/password-recovery`)
      .send({
        email: 'mail.com',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual({
      errorsMessages: [
        {
          message: 'Email must be a valid email address',
          field: 'email',
        },
      ],
    });
  });
});

describe(`Endpoint (POST) - /new-password`, () => {
  it(`Should get status`, async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const user = userList[0];

    const recoveryPassToken = await jwtService.signAsync(
      { userId: user?._id.toString() },
      { expiresIn: '1d', secret: apiSettings.JWT_SECRET_KEY },
    );

    await mockUserModel.updateOne(
      { _id: user!._id.toString() },
      {
        recoveryCode: {
          code: recoveryPassToken,
          isUsed: false,
        },
      },
    );

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/new-password`)
      .send({
        recoveryCode: recoveryPassToken,
        newPassword: 'password1',
      })
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`Should get status ${HttpStatus.BAD_REQUEST} if userId=null `, async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const user = userList[0];

    const recoveryPassToken = await jwtService.signAsync(
      { userId: null },
      { expiresIn: '1d', secret: apiSettings.JWT_SECRET_KEY },
    );

    await mockUserModel.updateOne(
      { _id: user!._id.toString() },
      {
        recoveryCode: {
          code: recoveryPassToken,
          isUsed: false,
        },
      },
    );

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/new-password`)
      .send({
        recoveryCode: recoveryPassToken,
        newPassword: 'password1',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual({
      errorsMessages: [
        { message: 'Recovery code not correct', field: 'recoveryCode' },
      ],
    });
  });

  it(`Should get status ${HttpStatus.BAD_REQUEST} if token expired `, async () => {
    const userList = await mockUserModel.insertMany(
      testSeeder.createUserListDto(3),
    );

    const user = userList[0];

    const recoveryPassToken = await jwtService.signAsync(
      { userId: null },
      { expiresIn: 0, secret: apiSettings.JWT_SECRET_KEY },
    );

    await mockUserModel.updateOne(
      { _id: user!._id.toString() },
      {
        recoveryCode: {
          code: recoveryPassToken,
          isUsed: false,
        },
      },
    );

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/new-password`)
      .send({
        recoveryCode: recoveryPassToken,
        newPassword: 'password1',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual({
      errorsMessages: [
        { message: 'Recovery code not correct', field: 'recoveryCode' },
      ],
    });
  });
});
