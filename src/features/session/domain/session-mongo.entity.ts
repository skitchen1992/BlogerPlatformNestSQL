import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Session {
  @Prop({ type: String, require: true })
  userId: string;

  @Prop({ type: String, require: true })
  ip: string;

  @Prop({ type: String, require: true })
  title: string;

  @Prop({ type: String, require: true })
  lastActiveDate: string;

  @Prop({ type: String, require: true })
  tokenIssueDate: string;

  @Prop({ type: String, require: true })
  tokenExpirationDate: string;

  @Prop({ type: String, require: true })
  deviceId: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
//Для загрузки статических методов
SessionSchema.loadClass(Session);

//Types
export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument>;
