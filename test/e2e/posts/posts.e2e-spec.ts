import { APP_PREFIX } from '@settings/apply-app-setting';
import request from 'supertest';
import {
  apiSettings,
  app,
  mockBlogModel,
  mockCommentModel,
  mockLikeModel,
  mockPostModel,
  mockUserModel,
} from '../../jest.setup';
import { HttpStatus } from '@nestjs/common';
import { testSeeder } from '../../utils/test.seeder';
import {
  LikeStatusEnum,
  ParentTypeEnum,
} from '@features/likes/domain/likes.entity';
import { ObjectId } from 'mongodb';
import {
  createAuthorizationHeader,
  createBearerAuthorizationHeader,
} from '../../utils/test-helpers';
import * as data from './dataset';
import { PostOutputDtoMapper } from '@features/posts/api/dto/output/post.output.dto';
import { ID } from '../../mocks/mocks';
import { sleep } from '@utils/utils';
import { SkipThrottle } from '@nestjs/throttler';

describe(`Endpoint (GET) - /posts`, () => {
  it('Should get empty array', async () => {
    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    expect(res.body.items.length).toBe(0);
  });

  it('Should get not empty array', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );

    const authorId = new ObjectId().toString();
    const likesList = await mockLikeModel.insertMany(
      testSeeder.createPostLikeListDto(
        1,
        postList[0]._id.toString(),
        LikeStatusEnum.LIKE,
        ParentTypeEnum.POST,
        authorId,
      ),
    );

    const extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 1,
      myStatus: LikeStatusEnum.NONE,
      newestLikes: [
        {
          addedAt: likesList[0].createdAt,
          login: '',
          userId: authorId,
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    expect(res.body.items.length).toBe(1);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: postList.map((post) =>
        PostOutputDtoMapper(post, extendedLikesInfo),
      ),
    });
  });

  it('Should get second page', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(3, blogId),
    );

    const authorId = new ObjectId().toString();

    await mockLikeModel.insertMany(
      testSeeder.createPostLikeListDto(
        1,
        postList[0]._id.toString(),
        LikeStatusEnum.LIKE,
        ParentTypeEnum.POST,
        authorId,
      ),
    );

    const extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: LikeStatusEnum.NONE,
      newestLikes: [],
    };

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts?pageNumber=2&pageSize=2`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 2,
      page: 2,
      pageSize: 2,
      totalCount: 3,
      items: [PostOutputDtoMapper(postList[2], extendedLikesInfo)],
    });
  });
});

describe(`Endpoint (GET) by ID - /posts/:id`, () => {
  it('Should get a post', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();
    const authorId = new ObjectId().toString();
    const likesList = await mockLikeModel.insertMany(
      testSeeder.createPostLikeListDto(
        1,
        postList[0]._id.toString(),
        LikeStatusEnum.LIKE,
        ParentTypeEnum.POST,
        authorId,
      ),
    );

    const extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 1,
      myStatus: LikeStatusEnum.NONE,
      newestLikes: [
        {
          addedAt: likesList[0].createdAt,
          login: '',
          userId: authorId,
        },
      ],
    };
    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      PostOutputDtoMapper(postList[0], extendedLikesInfo),
    );
  });

  it(`Should get status ${HttpStatus.NOT_FOUND}`, async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    await mockPostModel.insertMany(testSeeder.createPostListDto(1, blogId));

    await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${ID}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe(`Endpoint (POST) - /posts`, () => {
  it('Should add post', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();
    const blogName = blogList[0].name;

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost0, blogId })
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(
      expect.objectContaining({ ...data.dataSetNewPost0, blogId, blogName }),
    );
  });

  it('Should get error while blog not found', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewPost0)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet0);
  });

  it('Should get Error while field "title" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost1, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet1);
  });

  it('Should get Error while field "title" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost2, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet2);
  });

  it('Should get Error while field "title" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost3, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet11);
  });

  it('Should get Error while field "shortDescription" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost4, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet12);
  });

  it('Should get Error while field "shortDescription" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost5, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet13);
  });

  it('Should get Error while field "description" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost6, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet6);
  });

  it('Should get Error while field "content" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost7, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet7);
  });

  it('Should get Error while field "content" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost8, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet8);
  });

  it('Should get Error while field "content" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost9, blogId: blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet14);
  });
});

describe(`Endpoint (PUT) - /posts/:id`, () => {
  it('Should update post', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();
    const blogName = postList[0].blogName;

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetUpdatePost, blogId })
      .expect(HttpStatus.NO_CONTENT);

    const post = await mockPostModel.findById(postId);

    expect(post).toEqual(
      expect.objectContaining({ ...data.dataSetUpdatePost, blogId, blogName }),
    );
  });

  it('Should get Error while field "title" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost1, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet1);
  });

  it('Should get Error while field "title" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost2, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet15);
  });

  it('Should get Error while field "title" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost3, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet3);
  });

  it('Should get Error while field "shortDescription" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost4, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet16);
  });

  it('Should get Error while field "shortDescription" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();
    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost5, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet5);
  });

  it('Should get Error while field "description" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost6, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet17);
  });

  it('Should get Error while field "content" is too long', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost7, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet7);
  });

  it('Should get Error while field "content" is not a string', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost8, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet18);
  });

  it('Should get Error while field "content" is empty', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost9, blogId })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet9);
  });

  it('Should get Error while we add too many fields specified', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({ ...data.dataSetNewPost10, blogId })
      .expect(HttpStatus.NO_CONTENT);
  });
});

describe(`Endpoint (DELETE) - /posts/:id`, () => {
  it('Should delete post', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/posts/${postId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NO_CONTENT);

    const post = await mockPostModel.findById(postId);

    expect(post).toBe(null);
  });

  it(`Should get error ${HttpStatus.NOT_FOUND}`, async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/posts/${ID}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NOT_FOUND);

    const post = await mockPostModel.findById(postId);
    expect(Boolean(post)).toBe(true);
  });
});

describe(`Endpoint (POST) - /:postId/comments`, () => {
  it('Should get created comment', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(
      expect.objectContaining({
        content: 'content content content',
        commentatorInfo: expect.objectContaining({ userLogin: login }),
        likesInfo: { likesCount: 0, dislikesCount: 0, myStatus: 'None' },
      }),
    );
  });

  it(`Should get ${HttpStatus.BAD_REQUEST}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'c',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it(`Should get ${HttpStatus.UNAUTHORIZED}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer()).post(`${APP_PREFIX}/auth/login`).send({
      loginOrEmail: login,
      password,
    });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId.toString()}/comments`)
      .send({
        content: 'c',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it(`Should get ${HttpStatus.NOT_FOUND}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${ID}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe(`Endpoint (GET) - /:postId/comments`, () => {
  it('Should get empty array comment', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });

  it('Should get not empty array comment', async () => {
    const { login, password, email } = testSeeder.createUserDto();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email,
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      })
      .expect(HttpStatus.OK);

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        expect.objectContaining({
          content: 'content content content',
          commentatorInfo: expect.objectContaining({ userLogin: login }),
          likesInfo: {
            dislikesCount: 0,
            likesCount: 0,
            myStatus: 'None',
          },
        }),
      ],
    });
  });

  it('Should get comments with likes', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        expect.objectContaining({
          content: 'content content content',
          commentatorInfo: expect.objectContaining({ userLogin: login }),
          likesInfo: {
            dislikesCount: 0,
            likesCount: 0,
            myStatus: 'None',
          },
        }),
      ],
    });
  });

  it(`Should get ${HttpStatus.NOT_FOUND}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${ID}/comments`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe(`Endpoint (PUT) - /:postId/like-status`, () => {
  it('Should create like', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 1,
          myStatus: 'Like',
          newestLikes: [
            expect.objectContaining({
              login: 'testLogin',
            }),
          ],
        },
      }),
    );
  });

  it('Should change Like to Dislike', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.DISLIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        extendedLikesInfo: {
          dislikesCount: 1,
          likesCount: 0,
          myStatus: 'Dislike',
          newestLikes: [],
        },
      }),
    );
  });

  it('Should change Like to None', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/posts/${postId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.NONE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/posts/${postId}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: LikeStatusEnum.NONE,
          newestLikes: [],
        },
      }),
    );
  });

  it('Should change Like to Like', async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const commentList = await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1, postId),
    );
    const commentId = commentList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${commentId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${commentId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${commentId}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        likesInfo: {
          dislikesCount: 0,
          likesCount: 1,
          myStatus: LikeStatusEnum.LIKE,
        },
      }),
    );
  });

  it(`Should get ${HttpStatus.BAD_REQUEST}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const commentList = await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1, postId),
    );
    const commentId = commentList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${commentId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: '',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it(`Should get ${HttpStatus.UNAUTHORIZED}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const commentList = await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1, postId),
    );
    const commentId = commentList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${commentId}/like-status`)
      .set(createBearerAuthorizationHeader(''))
      .send({
        likeStatus: '',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it(`Should get ${HttpStatus.NOT_FOUND}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login,
        password,
        email: 'example@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1, postId),
    );

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${ID}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NOT_FOUND);
  });
});
