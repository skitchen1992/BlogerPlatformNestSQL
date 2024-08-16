import { add, getCurrentISOStringDate } from '@utils/dates';
import { getUniqueId } from '@utils/utils';
import { Blog } from '@features/blogs/domain/blog.entity';
import { User } from '@features/users/domain/user.entity';
import { Post } from '@features/posts/domain/post.entity';
import { ObjectId } from 'mongodb';
import { Comment } from '@features/comments/domain/comment.entity';
import {
  Like,
  LikeStatusEnum,
  ParentTypeEnum,
} from '@features/likes/domain/likes.entity';

export const testSeeder = {
  createUserDto(): User {
    return {
      login: 'test',
      email: 'test@gmail.com',
      password: '123456789',
      createdAt: getCurrentISOStringDate(),
    };
  },

  createUserDtoHashPass(hashPass: string): User {
    return {
      login: 'test',
      email: 'test@gmail.com',
      password: hashPass,
      createdAt: getCurrentISOStringDate(),
    };
  },

  createUserListDto(count: number, pass?: string): User[] {
    return new Array(count).fill(null).map((item, index) => {
      return {
        login: `test${index}`,
        email: `test${index}@gmail.com`,
        password: pass || `123456789${index}`,
        createdAt: getCurrentISOStringDate(),
        emailConfirmation: {
          confirmationCode: getUniqueId(),
          expirationDate: add(getCurrentISOStringDate(), { hours: 1 }),
          isConfirmed: true,
        },
      };
    });
  },

  createBlogDto(): Blog {
    return {
      name: 'Test',
      description: 'Test description',
      websiteUrl: 'https://string.com',
      createdAt: getCurrentISOStringDate(),
      isMembership: false,
    };
  },

  createBlogListDto(count: number): Blog[] {
    return new Array(count).fill(null).map((item, i) => {
      return {
        name: `Test${i}`,
        description: `Test description${i}`,
        websiteUrl: `https://string${i}.com`,
        createdAt: getCurrentISOStringDate(),
        isMembership: false,
      };
    });
  },

  createPostDto(blogId: string): Post {
    return {
      title: 'Nikita',
      shortDescription: 'ShortDescription',
      content: 'Content',
      blogId,
      blogName: 'Blog name',
      createdAt: getCurrentISOStringDate(),
    };
  },

  createPostListDto(count: number, blogId: string): Post[] {
    return new Array(count).fill(null).map((item, i) => {
      return {
        title: `Nikita${i}`,
        shortDescription: `ShortDescription${i}`,
        content: `Content${i}`,
        blogId,
        blogName: `Blog name${i}`,
        createdAt: getCurrentISOStringDate(),
      };
    });
  },

  createDocumentsDto() {
    return {
      ip: '1',
      url: 'url',
      date: getCurrentISOStringDate(),
    };
  },

  createDocumentsListDto(count: number) {
    return new Array(count).fill(null).map(() => {
      return {
        ip: '1',
        url: 'url',
        date: getCurrentISOStringDate(),
      };
    });
  },

  createCommentDto(
    userId = new ObjectId().toString(),
    postId = new ObjectId().toString(),
  ): Comment {
    return {
      content: 'Content Content Content',
      commentatorInfo: {
        userId,
        userLogin: 'login',
      },
      postId,
      createdAt: getCurrentISOStringDate(),
    };
  },

  createCommentListDto(
    count: number,
    userId = new ObjectId().toString(),
    postId = new ObjectId().toString(),
  ): Comment[] {
    return new Array(count).fill(null).map((item, i) => {
      return {
        content: `Content Content Content${i}`,
        commentatorInfo: {
          userId,
          userLogin: `login${i}`,
        },
        postId,
        createdAt: getCurrentISOStringDate(),
        _id: new ObjectId(),
      };
    });
  },

  createPostLikeDto(): Like {
    return {
      createdAt: getCurrentISOStringDate(),
      status: LikeStatusEnum.LIKE,
      authorId: new ObjectId().toString(),
      parentId: new ObjectId().toString(),
      parentType: ParentTypeEnum.POST,
    };
  },

  createPostLikeListDto(
    count: number,
    parentId: string,
    status: LikeStatusEnum,
    parentType: ParentTypeEnum,
    authorId = new ObjectId().toString(),
  ): Like[] {
    return new Array(count).fill(null).map(() => {
      return {
        createdAt: getCurrentISOStringDate(),
        status,
        authorId,
        parentId,
        parentType,
      };
    });
  },
};
