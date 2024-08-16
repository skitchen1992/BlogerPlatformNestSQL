import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../modules/shared.module';
import { Like, LikeSchema } from '@features/likes/domain/likes.entity';
import { LikesRepository } from '@features/likes/infrastructure/likes.repository';
import { LikeOperationHandler } from '@features/posts/application/handlers/like-operation.handler';

const likesProviders: Provider[] = [LikesRepository, LikeOperationHandler];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
    SharedModule,
    // forwardRef(() => BlogsModule),
  ],
  providers: [...likesProviders],
  controllers: [],
  // exports: [CommentsRepository, CommentsQueryRepository],
})
export class LikesModule {}
