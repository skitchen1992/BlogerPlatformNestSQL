import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { AppModule } from '../src/modules/app.module';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from '@features/users/domain/user.entity';
import { applyAppSettings } from '@settings/apply-app-setting';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '@settings/configuration';
import { APISettings } from '@settings/api-settings';
import { EnvironmentSettings } from '@settings/env-settings';
import { Blog, BlogDocument } from '@features/blogs/domain/blog.entity';
import { Post, PostDocument } from '@features/posts/domain/post.entity';
import {
  Comment,
  CommentDocument,
} from '@features/comments/domain/comment.entity';
import { Like, LikeDocument } from '@features/likes/domain/likes.entity';
import { HashBuilder } from '@utils/hash-builder';
import { SharedService } from '@infrastructure/servises/shared/shared.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

let mongoDB: MongoMemoryServer;
export let app: INestApplication;
export let mockUserModel: Model<UserDocument>;
export let mockBlogModel: Model<BlogDocument>;
export let mockPostModel: Model<PostDocument>;
export let mockCommentModel: Model<CommentDocument>;
export let mockLikeModel: Model<LikeDocument>;
export let apiSettings: APISettings;
export let environmentSettings: EnvironmentSettings;

export const hashBuilder = new HashBuilder();
export const jwtService = new JwtService();

let sharedService: SharedService;

beforeAll(async () => {
  mongoDB = await MongoMemoryServer.create();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
      MongooseModule.forRootAsync({
        useFactory: async () => ({
          uri: mongoDB.getUri(),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }),
      }),
    ],
  }).compile();

  mockUserModel = moduleFixture.get<Model<UserDocument>>(
    getModelToken(User.name),
  );

  mockBlogModel = moduleFixture.get<Model<BlogDocument>>(
    getModelToken(Blog.name),
  );

  mockPostModel = moduleFixture.get<Model<PostDocument>>(
    getModelToken(Post.name),
  );

  mockCommentModel = moduleFixture.get<Model<CommentDocument>>(
    getModelToken(Comment.name),
  );

  mockLikeModel = moduleFixture.get<Model<LikeDocument>>(
    getModelToken(Like.name),
  );

  sharedService = moduleFixture.get<SharedService>(SharedService);
  // nodeMailer = moduleFixture.get<NodeMailer>(NodeMailer);

  jest
    .spyOn(sharedService, 'sendRegisterEmail')
    .mockImplementation(async () => {
      return Promise.resolve();
    });

  jest
    .spyOn(sharedService, 'sendRecoveryPassEmail')
    .mockImplementation(async () => {
      return Promise.resolve();
    });

  app = moduleFixture.createNestApplication();

  const configService = app.get(ConfigService<ConfigurationType, true>);

  apiSettings = configService.get('apiSettings', { infer: true });
  environmentSettings = configService.get('environmentSettings', {
    infer: true,
  });

  applyAppSettings(app);

  await app.init();
});

beforeEach(async () => {
  await mockUserModel.deleteMany({});
  await mockBlogModel.deleteMany({});
  await mockPostModel.deleteMany({});
  await mockCommentModel.deleteMany({});
  await mockLikeModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoDB.stop();
  await app.close();
});
