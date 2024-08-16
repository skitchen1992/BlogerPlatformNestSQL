import { SortOrder } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UsersQuery } from '@features/users/api/dto/output/user.output.pagination.dto';
import { BlogsQuery } from '@features/blogs/api/dto/output/blog.output.pagination.dto';
import { PostQuery } from '@features/posts/api/dto/output/post.output.pagination.dto';
import { CommentQuery } from '@features/comments/api/dto/output/comment.output.pagination.dto';

type Filters =
  | string
  | { [key: string]: SortOrder | { $meta: any } }
  | [string, SortOrder][]
  | null
  | undefined;

type Query = Record<string, unknown>;

@Injectable()
export class Pagination {
  protected DEFAULT_SORT = 'desc';
  protected DEFAULT_PAGE_NUMBER = 1;
  protected DEFAULT_PAGE_SIZE = 10;

  protected buildQuery(
    queryParams: any,
    searchTerms: { [key: string]: string } = {},
    params?: Query,
  ) {
    const { sortBy, sortDirection, pageNumber, pageSize } = queryParams;

    const query: Query = {};
    for (const term in searchTerms) {
      if (queryParams[term]) {
        query[searchTerms[term]] = {
          $regex: new RegExp(`.*${queryParams[term]}.*`, 'i'),
        };
      }
    }
    if (params) {
      for (const param in params) {
        if (params[param]) {
          query[param] = params[param];
        }
      }
    }

    const sort: Filters = {};
    if (sortBy) {
      sort[sortBy] = sortDirection || this.DEFAULT_SORT;
    } else {
      sort.createdAt = sortDirection || this.DEFAULT_SORT;
      sort._id = 1;
    }

    const defaultPageNumber = Number(pageNumber) || this.DEFAULT_PAGE_NUMBER;
    const defaultPageSize = Number(pageSize) || this.DEFAULT_PAGE_SIZE;
    const skip = (defaultPageNumber - 1) * defaultPageSize;

    return {
      query,
      sort,
      skip,
      pageSize: defaultPageSize,
      page: defaultPageNumber,
    };
  }

  public getBlogs(queryParams: BlogsQuery) {
    return this.buildQuery(queryParams, { searchNameTerm: 'name' });
  }

  public getPosts(queryParams: PostQuery, params?: { blogId?: string }) {
    return this.buildQuery(queryParams, {}, params);
  }

  public getComments(queryParams: CommentQuery, params?: { postId: string }) {
    return this.buildQuery(queryParams, {}, params);
  }

  public getUsers(queryParams: UsersQuery) {
    const { searchLoginTerm, searchEmailTerm } = queryParams;

    const query: Query = {};
    if (searchLoginTerm && searchEmailTerm) {
      query.$or = [
        { login: { $regex: new RegExp(`.*${searchLoginTerm}.*`, 'i') } },
        { email: { $regex: new RegExp(`.*${searchEmailTerm}.*`, 'i') } },
      ];
    } else {
      if (searchLoginTerm) {
        query.login = { $regex: new RegExp(`.*${searchLoginTerm}.*`, 'i') };
      }
      if (searchEmailTerm) {
        query.email = { $regex: new RegExp(`.*${searchEmailTerm}.*`, 'i') };
      }
    }

    return this.buildQuery(
      {
        ...queryParams,
        searchLoginTerm: undefined,
        searchEmailTerm: undefined,
      },
      {},
      query,
    );
  }
}
