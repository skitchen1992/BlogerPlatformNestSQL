import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post.entity';
import { UpdatePostDto } from '@features/posts/api/dto/input/update-post.input.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private postModel: PostModelType) {}

  public async create(newPost: Post): Promise<string> {
    const insertResult = await this.postModel.insertMany([newPost]);

    return insertResult[0].id;
  }

  public async update(id: string, data: UpdatePostDto): Promise<boolean> {
    const updateResult = await this.postModel.updateOne({ _id: id }, data);

    return updateResult.modifiedCount === 1;
  }

  public async delete(id: string): Promise<boolean> {
    const deleteResult = await this.postModel.deleteOne({ _id: id });

    return deleteResult.deletedCount === 1;
  }
}
