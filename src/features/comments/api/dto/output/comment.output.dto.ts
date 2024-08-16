import { CommentDocument } from '../../../domain/comment.entity';
import { LikeStatusEnum } from '@features/likes/domain/likes.entity';

export interface ILikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
}
export class CommentOutputDto {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  postId: string;
  createdAt: string;
  likesInfo: ILikesInfo;
}

// MAPPERS

export const CommentOutputDtoMapper = (
  comment: CommentDocument,
  likesInfo: ILikesInfo,
): CommentOutputDto => {
  const outputDto = new CommentOutputDto();

  outputDto.id = comment._id.toString();
  outputDto.content = comment.content;
  outputDto.commentatorInfo = {
    userId: comment.commentatorInfo.userId,
    userLogin: comment.commentatorInfo.userLogin,
  };
  outputDto.createdAt = comment.createdAt;
  outputDto.likesInfo = likesInfo;

  return outputDto;
};
