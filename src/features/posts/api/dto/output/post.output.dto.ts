import { PostDocument } from '../../../domain/post.entity';
import { LikeStatusEnum } from '@features/likes/domain/likes.entity';

export type NewestLike = {
  addedAt: string;
  userId: string;
  login: string;
};

export type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
  newestLikes: NewestLike[];
};
export class PostOutputDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfo;
}

// MAPPERS

export const PostOutputDtoMapper = (
  post: PostDocument,
  extendedLikesInfo: ExtendedLikesInfo,
): PostOutputDto => {
  const outputDto = new PostOutputDto();

  outputDto.id = post._id.toString();
  outputDto.title = post.title;
  outputDto.shortDescription = post.shortDescription;
  outputDto.content = post.content;
  outputDto.blogId = post.blogId;
  outputDto.blogName = post.blogName;
  outputDto.createdAt = post.createdAt;
  outputDto.extendedLikesInfo = extendedLikesInfo;

  return outputDto;
};
