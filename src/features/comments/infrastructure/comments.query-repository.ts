import { Injectable } from '@nestjs/common';
import { CommentModelType } from '../domain/comment-mongo.entity';
import { Comment } from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentOutputDto,
  CommentOutputDtoMapper,
  ILikesInfo,
} from '../api/dto/output/comment.output.dto';
import { Pagination } from '@base/models/pagination.base.model';
import {
  CommentOutputPaginationDto,
  CommentOutputPaginationDtoMapper,
  CommentQuery,
} from '@features/comments/api/dto/output/comment.output.pagination.dto';
import {
  Like,
  LikeModelType,
  LikeStatusEnum,
  ParentTypeEnum,
} from '@features/likes/domain/likes.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Post } from '@features/posts/domain/post.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
    @InjectModel(Like.name) private likeModel: LikeModelType,
    private readonly pagination: Pagination,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getLikesInfoForAuthUser(
    commentId: string,
    userId: string,
  ): Promise<ILikesInfo> {
    const likeDislikeCounts = await this.getLikeDislikeCounts(commentId);
    const likeStatus = await this.getUserLikeStatus(commentId, userId);

    return {
      likesCount: likeDislikeCounts.likesCount,
      dislikesCount: likeDislikeCounts.dislikesCount,
      myStatus: likeStatus,
    };
  }

  private async getLikesInfoForNotAuthUser(
    commentId: string,
  ): Promise<ILikesInfo> {
    const likeDislikeCounts = await this.getLikeDislikeCounts(commentId);
    const likeStatus = await this.getUserLikeStatus(commentId, '');

    return {
      likesCount: likeDislikeCounts.likesCount,
      dislikesCount: likeDislikeCounts.dislikesCount,
      myStatus: likeStatus,
    };
  }

  private async getUserLikeStatus(
    commentId: string,
    userId: string,
  ): Promise<LikeStatusEnum> {
    const user = await this.likeModel
      .findOne({
        parentId: commentId,
        parentType: ParentTypeEnum.COMMENT,
        authorId: userId,
      })
      .lean();

    return user?.status || LikeStatusEnum.NONE;
  }

  private async getLikeDislikeCounts(
    commentId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    const result = await this.likeModel.aggregate([
      { $match: { parentId: commentId, parentType: ParentTypeEnum.COMMENT } },
      {
        $group: {
          _id: null,
          likesCount: {
            $sum: { $cond: [{ $eq: ['$status', LikeStatusEnum.LIKE] }, 1, 0] },
          },
          dislikesCount: {
            $sum: {
              $cond: [{ $eq: ['$status', LikeStatusEnum.DISLIKE] }, 1, 0],
            },
          },
        },
      },
    ]);

    return result.length ? result[0] : { likesCount: 0, dislikesCount: 0 };
  }

  public async getById(
    commentId: string,
    userId?: string,
  ): Promise<CommentOutputDto | null> {
    try {
      const commentList: Comment[] = await this.dataSource.query(
        `
    SELECT *
    FROM comments c
    WHERE c.id = $1
    `,
        [commentId],
      );

      const comment = commentList.at(0);

      if (!comment) {
        return null;
      }

      if (!userId) {
        const likeInfo = await this.getLikesInfoForNotAuthUser(commentId);
        return CommentOutputDtoMapper(comment, likeInfo);
      }

      const likeInfo = await this.getLikesInfoForAuthUser(commentId, userId);
      return CommentOutputDtoMapper(comment, likeInfo);
    } catch (e) {
      return null;
    }
  }

  public async getAll(
    query: CommentQuery,
    params?: { postId: string },
    userId?: string,
  ): Promise<CommentOutputPaginationDto> {
    // const pagination = this.pagination.getComments(query, params);
    //
    // const comments = await this.commentModel
    //   .find(pagination.query)
    //   .sort(pagination.sort)
    //   .skip(pagination.skip)
    //   .limit(pagination.pageSize)
    //   .lean();
    //
    // const totalCount = await this.commentModel.countDocuments(pagination.query);

    const {
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = query;

    const validSortDirections = ['asc', 'desc'];
    const direction = validSortDirections.includes(sortDirection)
      ? sortDirection
      : 'desc';

    const sortField = sortBy === 'userLogin' ? 'user_login' : 'created_at';

    let whereConditions = '';
    const queryParams: any[] = [];

    if (params?.postId) {
      whereConditions = `post_id = $1`;
      queryParams.push(params.postId);
    } else {
      whereConditions = 'TRUE';
    }

    const collateClause = sortField === 'user_login' ? 'COLLATE "C"' : '';

    const comments: Comment[] = await this.dataSource.query(
      `
    SELECT *
    FROM
        comments
    WHERE
        ${whereConditions}
    ORDER BY
        ${sortField} ${collateClause} ${direction}
    LIMIT $${queryParams.length + 1}
    OFFSET $${queryParams.length + 2} * ($${queryParams.length + 3} - 1);
    `,
      [
        ...queryParams,
        pageSize, // LIMIT
        pageSize, // OFFSET calculation
        pageNumber, // used for OFFSET
      ],
    );

    const commentList = await Promise.all(
      comments.map(async (comment) => {
        if (userId) {
          const like = await this.getLikesInfoForAuthUser(comment.id, userId);
          return CommentOutputDtoMapper(comment, like);
        } else {
          const like = await this.getLikesInfoForNotAuthUser(comment.id);
          return CommentOutputDtoMapper(comment, like);
        }
      }),
    );

    const totalCount = await this.dataSource.query(
      `
    SELECT COUNT(*)::int AS count
    FROM comments
    WHERE
        ${whereConditions}
    `,
      queryParams,
    );

    return CommentOutputPaginationDtoMapper(
      commentList,
      totalCount.at(0).count,
      Number(pageSize),
      Number(pageNumber),
    );
  }
}
