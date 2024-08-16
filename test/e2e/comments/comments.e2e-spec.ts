import { APP_PREFIX } from '@settings/apply-app-setting';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  apiSettings,
  app,
  mockBlogModel,
  mockCommentModel,
  mockPostModel,
} from '../../jest.setup';
import { testSeeder } from '../../utils/test.seeder';
import { ID } from '../../mocks/mocks';
import {
  createAuthorizationHeader,
  createBearerAuthorizationHeader,
} from '../../utils/test-helpers';
import { LikeStatusEnum } from '@features/likes/domain/likes.entity';

describe(`Endpoint (GET) - /:commentId`, () => {
  it('Should get comment', async () => {
    const commentList = await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1),
    );
    const commentId = commentList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${commentId}`)
      .expect(HttpStatus.OK);

    const comment = {
      commentatorInfo: {
        userId: commentList[0].commentatorInfo.userId,
        userLogin: commentList[0].commentatorInfo.userLogin,
      },
      content: commentList[0].content,
      createdAt: commentList[0].createdAt,
      id: commentList[0]._id.toString(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.NONE,
      },
    };

    expect(res.body).toEqual(comment);
  });

  it(`Should get comment with ${LikeStatusEnum.NONE} status`, async () => {
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

    const commentList = await mockCommentModel.insertMany(
      testSeeder.createCommentListDto(1),
    );
    const commentId = commentList[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${commentId}/like-status`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        likeStatus: LikeStatusEnum.LIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${commentId}`)
      .expect(HttpStatus.OK);

    const comment = {
      commentatorInfo: {
        userId: commentList[0].commentatorInfo.userId,
        userLogin: commentList[0].commentatorInfo.userLogin,
      },
      content: commentList[0].content,
      createdAt: commentList[0].createdAt,
      id: commentList[0]._id.toString(),
      likesInfo: {
        likesCount: 1,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.NONE,
      },
    };

    expect(res.body).toEqual(comment);
  });

  it(`Should get ${HttpStatus.NOT_FOUND}`, async () => {
    await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${ID}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe(`Endpoint (PUT) - /comments`, () => {
  it('Should update comment', async () => {
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

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content content',
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        content: 'content content content content',
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

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'co',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: 'Content must be between 20 and 300 characters',
        },
      ],
    });
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

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .send({
        content: 'co content content content',
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

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${ID}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'co content content content',
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it(`Should get ${HttpStatus.FORBIDDEN}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    const login2 = 'testLogin2';
    const password2 = 'string2';

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

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login: login2,
        password: password2,
        email: 'exame@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const token2 = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login2,
        password: password2,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token2.body.accessToken))
      .send({
        content: 'co content content content',
      })
      .expect(HttpStatus.FORBIDDEN);
  });
});

describe(`Endpoint (DELETE) -/comments`, () => {
  it('Should delete comment', async () => {
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

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content content',
      })
      .expect(HttpStatus.NO_CONTENT);

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.NO_CONTENT);
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

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
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

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/comments/${ID}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'co content content content',
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it(`Should get ${HttpStatus.FORBIDDEN}`, async () => {
    const login = 'testLogin';
    const password = 'string';

    const login2 = 'testLogin2';
    const password2 = 'string2';

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

    await request(app.getHttpServer())
      .post(`${APP_PREFIX}/users`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        login: login2,
        password: password2,
        email: 'exame@example.com',
      })
      .expect(HttpStatus.CREATED);

    const token = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login,
        password,
      });

    const token2 = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/auth/login`)
      .send({
        loginOrEmail: login2,
        password: password2,
      });

    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );
    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(1, blogId),
    );
    const postId = postList[0]._id.toString();

    const comment = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/posts/${postId}/comments`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .send({
        content: 'content content content',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/comments/${comment.body.id.toString()}`)
      .set(createBearerAuthorizationHeader(token2.body.accessToken))
      .send({
        content: 'co content content content',
      })
      .expect(HttpStatus.FORBIDDEN);
  });
});

describe(`Endpoint (PUT) - /:commentId/like-status`, () => {
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
        likeStatus: LikeStatusEnum.DISLIKE,
      })
      .expect(HttpStatus.NO_CONTENT);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/comments/${commentId}`)
      .set(createBearerAuthorizationHeader(token.body.accessToken))
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(
      expect.objectContaining({
        likesInfo: {
          dislikesCount: 1,
          likesCount: 0,
          myStatus: LikeStatusEnum.DISLIKE,
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
        likeStatus: LikeStatusEnum.NONE,
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
          likesCount: 0,
          myStatus: LikeStatusEnum.NONE,
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
