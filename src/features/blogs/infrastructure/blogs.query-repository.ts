import { Injectable } from '@nestjs/common';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlogOutputDto,
  BlogOutputDtoMapper,
} from '../api/dto/output/blog.output.dto';
import { Pagination } from '@base/models/pagination.base.model';
import {
  BlogOutputPaginationDto,
  BlogOutputPaginationDtoMapper,
  BlogsQuery,
} from '@features/blogs/api/dto/output/blog.output.pagination.dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: BlogModelType,
    private readonly pagination: Pagination,
  ) {}

  public async getById(userId: string): Promise<BlogOutputDto | null> {
    try {
      const blog = await this.blogModel.findById(userId).lean();

      if (!blog) {
        return null;
      }

      return BlogOutputDtoMapper(blog);
    } catch (e) {
      return null;
    }
  }

  public async getAll(query: BlogsQuery): Promise<BlogOutputPaginationDto> {
    const pagination = this.pagination.getBlogs(query);

    const users = await this.blogModel
      .find(pagination.query)
      .sort(pagination.sort)
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount = await this.blogModel.countDocuments(pagination.query);

    const blogList = users.map((user) => BlogOutputDtoMapper(user));

    return BlogOutputPaginationDtoMapper(
      blogList,
      totalCount,
      pagination.pageSize,
      pagination.page,
    );
  }
}
