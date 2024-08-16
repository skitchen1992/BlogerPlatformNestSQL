import { APP_PREFIX } from '@settings/apply-app-setting';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import * as data from './dataset';

import {
  apiSettings,
  app,
  mockBlogModel,
  mockPostModel,
} from '../../jest.setup';
import { testSeeder } from '../../utils/test.seeder';
import { BlogOutputDtoMapper } from '@features/blogs/api/dto/output/blog.output.dto';
import { getCurrentISOStringDate } from '@utils/dates';
import { LikeStatusEnum } from '@features/likes/domain/likes.entity';
import { PostOutputDtoMapper } from '@features/posts/api/dto/output/post.output.dto';
import { ID } from '../../mocks/mocks';
import { createAuthorizationHeader } from '../../utils/test-helpers';

describe.skip(`Blogs (e2e) GET - /blogs`, () => {
  it('Should get empty array', async () => {
    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    expect(res.body.items).toHaveLength(0);
    expect(1).toBe(1);
  });

  it('Should return blogs list with pagination metadata', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: blogList.map(BlogOutputDtoMapper),
    });
  });

  it('Should get filtered array by searchNameTerm=Nikita', async () => {
    await mockBlogModel.insertMany([
      {
        name: 'Nikita',
        description: 'Test description',
        websiteUrl: 'https://string.com',
        createdAt: getCurrentISOStringDate(),
        isMembership: false,
      },
      {
        name: 'Sacha',
        description: 'Test description',
        websiteUrl: 'https://string.com',
        createdAt: getCurrentISOStringDate(),
        isMembership: false,
      },
      {
        name: 'Mascha',
        description: 'Test description',
        websiteUrl: 'https://string.com',
        createdAt: getCurrentISOStringDate(),
        isMembership: false,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs/?searchNameTerm=Nikita`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: 'Nikita',
          description: 'Test description',
          websiteUrl: 'https://string.com',
          isMembership: false,
          createdAt: expect.any(String),
        }),
      ]),
    });
  });

  it('Should get second page', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(3),
    );

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs?pageNumber=2&pageSize=2`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 2,
      page: 2,
      pageSize: 2,
      totalCount: 3,
      items: [BlogOutputDtoMapper(blogList[2])],
    });
  });
});

describe.skip(`Blogs (e2e) GET - /:blogId/posts`, () => {
  it('Should get filtered array', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(3),
    );

    const blogId = blogList[0]._id.toString();

    const postList = await mockPostModel.insertMany(
      testSeeder.createPostListDto(3, blogId),
    );

    const extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: LikeStatusEnum.NONE,
      newestLikes: [],
    };

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs/${blogId}/posts`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 3,
      items: postList.map((post) =>
        PostOutputDtoMapper(post, extendedLikesInfo),
      ),
    });
  });

  it(`Should get status ${HttpStatus.NOT_FOUND}`, async () => {
    await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs/${ID}/posts`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe.skip(`Blogs (e2e) GET - /blogs/id`, () => {
  it('Should get blog', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(3),
    );

    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs/${blogId}`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual(BlogOutputDtoMapper(blogList[0]));
  });

  it(`Should get status ${HttpStatus.NOT_FOUND}`, async () => {
    await mockBlogModel.insertMany(testSeeder.createBlogListDto(3));

    await request(app.getHttpServer())
      .get(`${APP_PREFIX}/blogs/${ID}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe.skip(`Blogs (e2e) POST - /blogs`, () => {
  it('Should add blog', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        name: 'Test',
        description: 'Test description',
        websiteUrl: 'https://string.com',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(
      expect.objectContaining({
        name: 'Test',
        description: 'Test description',
        websiteUrl: 'https://string.com',
      }),
    );
  });

  it('Should get Error while field "name" is too long', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog1)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet1);
  });

  it('Should get Error while field "name" is not a string', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog2)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet2);
  });

  it('Should get Error while field "name" is empty', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog3)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet3);
  });

  it('Should get Error while field "description" is too long', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog4)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet4);
  });

  it('Should get Error while field "description" is not a string', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog5)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet5);
  });

  it('Should get Error while field "description" is empty', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog6)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet6);
  });

  it('Should get Error while field "websiteUrl" is not correct', async () => {
    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog7)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet7);
  });
});

describe.skip(`Blogs (e2e) POST - /:blogId/posts`, () => {
  it('Should add post for blog', async () => {
    const blogList = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(3),
    );

    const blogId = blogList[0]._id.toString();

    const res = await request(app.getHttpServer())
      .post(`${APP_PREFIX}/blogs/${blogId}/posts`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send({
        title: 'New title',
        shortDescription: 'New shortDescription',
        content: 'New content',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(
      expect.objectContaining({
        title: 'New title',
        shortDescription: 'New shortDescription',
        content: 'New content',
        blogId,
      }),
    );
  });
});

describe.skip(`Blogs (e2e) PUT - /:blogId/posts`, () => {
  it('Should update blog', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetUpdateBlog)
      .expect(HttpStatus.NO_CONTENT);

    const blog = await mockBlogModel.findById(blogId);

    expect(blog).toEqual(
      expect.objectContaining({
        name: 'New test',
        description: 'New Test description',
        websiteUrl: 'https://string.ru',
      }),
    );
  });

  it(`Should get error ${HttpStatus.NOT_FOUND}`, async () => {
    await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${ID}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetUpdateBlog)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('Should get Error while field "name" is too long', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog1)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet1);
  });

  it('Should get Error while field "name" is not a string', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog2)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet2);
  });

  it('Should get Error while field "name" is empty', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog3)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet3);
  });

  it('Should get Error while field "description" is too long', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog4)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet4);
  });

  it('Should get Error while field "description" is not a string', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog5)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet5);
  });

  it('Should get Error while field "description" is empty', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog6)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet6);
  });

  it('Should get Error while field "websiteUrl" is not correct', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    const res = await request(app.getHttpServer())
      .put(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .send(data.dataSetNewBlog7)
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body).toEqual(data.errorDataSet7);
  });
});

describe.skip(`Blogs (e2e) DELETE - /:blogId`, () => {
  it('Should delete blog', async () => {
    const result = await mockBlogModel.insertMany(
      testSeeder.createBlogListDto(1),
    );

    const blogId = result[0]._id.toString();

    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/blogs/${blogId}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`Should get error ${HttpStatus.NOT_FOUND}`, async () => {
    await request(app.getHttpServer())
      .delete(`${APP_PREFIX}/blogs/${ID}`)
      .set(
        createAuthorizationHeader(
          apiSettings.ADMIN_AUTH_USERNAME,
          apiSettings.ADMIN_AUTH_PASSWORD,
        ),
      )
      .expect(HttpStatus.NOT_FOUND);
  });
});
