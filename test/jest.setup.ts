import { INestApplication } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/modules/app.module';
import { applyAppSettings } from '@settings/apply-app-setting';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '@settings/configuration';
import { APISettings } from '@settings/api-settings';
import { EnvironmentSettings } from '@settings/env-settings';
import { HashBuilder } from '@utils/hash-builder';
import { SharedService } from '@infrastructure/servises/shared/shared.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export let app: INestApplication;

export let apiSettings: APISettings;
export let environmentSettings: EnvironmentSettings;

export let dataSource: DataSource;

export const hashBuilder = new HashBuilder();
export const jwtService = new JwtService();

let sharedService: SharedService;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
      // TypeOrmModule.forRootAsync({
      //   useFactory: (configService: ConfigService<ConfigurationType, true>) => {
      //     const apiSettings = configService.get('apiSettings', { infer: true });
      //
      //     return {
      //       type: 'postgres',
      //       host: 'ep-morning-pond-a29y4du7.eu-central-1.aws.neon.tech',
      //       port: 5432, // Укажите порт, если он отличается от 5432
      //       username: 'blogger_portal_owner',
      //       password: 'odtgrU9RjL3f',
      //       database: 'blogger_portal',
      //       ssl: {
      //         rejectUnauthorized: false, // Используется SSL-соединение
      //       },
      //       entities: [__dirname + '/**/*.entity{.ts,.js}'], // Убедитесь, что вы указали все необходимые расширения файлов
      //       synchronize: true, // В production используйте миграции
      //     };
      //   },
      //   inject: [ConfigService],
      // }),
    ],
  }).compile();

  // jest
  //   .spyOn(sharedService, 'sendRegisterEmail')
  //   .mockImplementation(async () => {
  //     return Promise.resolve();
  //   });
  //
  // jest
  //   .spyOn(sharedService, 'sendRecoveryPassEmail')
  //   .mockImplementation(async () => {
  //     return Promise.resolve();
  //   });

  app = moduleFixture.createNestApplication();

  sharedService = moduleFixture.get<SharedService>(SharedService);

  const configService = app.get(ConfigService<ConfigurationType, true>);

  apiSettings = configService.get('apiSettings', { infer: true });
  environmentSettings = configService.get('environmentSettings', {
    infer: true,
  });

  applyAppSettings(app);
  dataSource = moduleFixture.get<DataSource>(DataSource);

  await app.init();
});

beforeEach(async () => {
  await dataSource.query(
    `
        DELETE FROM users
    `,
    [],
  );
});

afterAll(async () => {
  await dataSource.destroy(); // Закрываем соединение с базой данных
  await app.close(); // Закрываем приложение
});
