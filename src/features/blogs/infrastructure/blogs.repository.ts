import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument, BlogModelType } from '../domain/blog-mongo.entity';
import { UpdateQuery } from 'mongoose';
import { Blog } from '@features/blogs/domain/blog.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: BlogModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async get(id: string): Promise<BlogDocument | null> {
    try {
      const blog = await this.blogModel.findById(id).lean();

      if (!blog) {
        return null;
      }

      return blog;
    } catch (e) {
      return null;
    }
  }

  public async create(newBlog: Blog): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `
      INSERT INTO blogs (name, description, website_url, is_membership)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
        [
          newBlog.name,
          newBlog.description,
          newBlog.website_url,
          newBlog.is_membership,
        ],
      );

      return result[0].id;
    } catch (e) {
      console.error('Error inserting blog into database', {
        error: e,
      });
      return '';
    }
  }

  public async update(id: string, data: UpdateQuery<Blog>): Promise<boolean> {
    try {
      const updatedResult = await this.blogModel.updateOne({ _id: id }, data);

      return updatedResult.modifiedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.blogModel.deleteOne({ _id: id });

      return deleteResult.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  public async isBlogExist(userId: string): Promise<boolean> {
    try {
      const blog = await this.blogModel.countDocuments({ _id: userId }).lean();

      return Boolean(blog);
    } catch (e) {
      return false;
    }
  }
}
