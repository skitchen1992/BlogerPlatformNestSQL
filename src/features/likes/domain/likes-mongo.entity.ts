import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export enum LikeStatusEnum {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None',
}

export enum ParentTypeEnum {
  POST = 'Post',
  COMMENT = 'Comment',
}
@Schema()
export class Like {
  @Prop({ type: String, require: true })
  createdAt: string;

  @Prop({
    type: String,
    require: true,
    enum: Object.values(LikeStatusEnum),
    required: true,
  })
  status: LikeStatusEnum;

  @Prop({ type: String, require: true })
  authorId: string;

  @Prop({ type: String, require: true })
  parentId: string;

  @Prop({ type: String, enum: Object.values(ParentTypeEnum), required: true })
  parentType: ParentTypeEnum;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
//Для загрузки статических методов
LikeSchema.loadClass(Like);

//Types
export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<LikeDocument>;
