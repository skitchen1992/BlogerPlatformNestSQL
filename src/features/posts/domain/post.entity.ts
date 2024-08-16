import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { getCurrentISOStringDate } from '@utils/dates';

@Schema()
export class Post {
  @Prop({ type: String, require: true, maxlength: 30 })
  title: string;

  @Prop({ type: String, require: true, maxlength: 100 })
  shortDescription: string;

  @Prop({ type: String, require: true, maxlength: 1000 })
  content: string;

  @Prop({ type: String, require: true })
  blogId: string;

  @Prop({ type: String, require: true })
  blogName: string;

  @Prop({ type: String, default: getCurrentISOStringDate() })
  createdAt: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
//Для загрузки статических методов
PostSchema.loadClass(Post);

//Types
export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument>;
