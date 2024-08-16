import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { UpdateQuery } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: BlogModelType) {}

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
    const insertResult = await this.blogModel.insertMany([newBlog]);

    return insertResult[0].id;
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
