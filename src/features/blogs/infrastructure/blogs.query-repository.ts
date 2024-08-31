import { Injectable } from '@nestjs/common';
import { Blog, BlogModelType } from '../domain/blog-mongo.entity';
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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: BlogModelType,
    @InjectDataSource() private dataSource: DataSource,
    private readonly pagination: Pagination,
  ) {}

  public async getById(blogId: string): Promise<BlogOutputDto | null> {
    try {
      const blog = await this.dataSource.query(
        `
      SELECT *
      FROM blogs b
      WHERE b.id = $1
        `,
        [blogId],
      );

      if (!blog.at(0)) {
        return null;
      }

      return BlogOutputDtoMapper(blog.at(0));
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
    //@ts-ignore
    const blogList = users.map((user) => BlogOutputDtoMapper(user));

    return BlogOutputPaginationDtoMapper(
      blogList,
      totalCount,
      pagination.pageSize,
      pagination.page,
    );
  }
}
