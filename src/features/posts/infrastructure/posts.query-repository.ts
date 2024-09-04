import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ExtendedLikesInfo,
  NewestLike,
  PostOutputDto,
  PostOutputDtoMapper,
} from '../api/dto/output/post.output.dto';
import {
  PostOutputPaginationDto,
  PostOutputPaginationDtoMapper,
  PostQuery,
} from '@features/posts/api/dto/output/post.output.pagination.dto';
import {
  Like,
  LikeModelType,
  LikeStatusEnum,
  ParentTypeEnum,
} from '@features/likes/domain/likes-mongo.entity';
import { NEWEST_LIKES_COUNT } from '@utils/consts';
import { User, UserModelType } from '@features/users/domain/user-mongo.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Post } from '@features/posts/domain/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
    @InjectModel(Like.name) private likeModel: LikeModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getLikeDislikeCounts(
    postId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    const result = await this.likeModel.aggregate([
      { $match: { parentId: postId, parentType: ParentTypeEnum.POST } },
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

  private async getUserLikeStatus(
    postId: string,
    userId: string,
  ): Promise<LikeStatusEnum> {
    const user = await this.likeModel
      .findOne({
        parentId: postId,
        parentType: ParentTypeEnum.POST,
        authorId: userId,
      })
      .lean();

    return user?.status || LikeStatusEnum.NONE;
  }

  private async getNewestLikes(
    postId: string,
    count: number,
  ): Promise<NewestLike[]> {
    const newestLikes = await this.likeModel
      .find({
        parentId: postId,
        parentType: ParentTypeEnum.POST,
        status: LikeStatusEnum.LIKE,
      })
      .sort({ createdAt: -1 })
      .limit(count)
      .exec();

    return await Promise.all(
      newestLikes.map(async (like) => {
        const user = await this.userModel.findById(like.authorId).exec();
        return {
          addedAt: like.createdAt,
          userId: like.authorId,
          login: user ? user.login : '',
        };
      }),
    );
  }

  private async getLikesInfoForAuthUser(
    postId: string,
    userId: string,
  ): Promise<ExtendedLikesInfo> {
    const likeDislikeCounts = await this.getLikeDislikeCounts(postId);
    const likeStatus = await this.getUserLikeStatus(postId, userId);
    const newestLikes = await this.getNewestLikes(postId, NEWEST_LIKES_COUNT);

    return {
      likesCount: likeDislikeCounts.likesCount,
      dislikesCount: likeDislikeCounts.dislikesCount,
      myStatus: likeStatus,
      newestLikes,
    };
  }

  private async getLikesInfoForNotAuthUser(
    postId: string,
  ): Promise<ExtendedLikesInfo> {
    const likeDislikeCounts = await this.getLikeDislikeCounts(postId);
    const likeStatus = await this.getUserLikeStatus(postId, '');
    const newestLikes = await this.getNewestLikes(postId, NEWEST_LIKES_COUNT);

    return {
      likesCount: likeDislikeCounts.likesCount,
      dislikesCount: likeDislikeCounts.dislikesCount,
      myStatus: likeStatus,
      newestLikes,
    };
  }

  public async getById(
    postId: string,
    userId?: string,
  ): Promise<PostOutputDto | null> {
    try {
      const postList = await this.dataSource.query(
        `
    SELECT *
    FROM posts p
    WHERE p.id = $1
    `,
        [postId],
      );

      const post = postList.at(0);

      if (!post) {
        return null;
      }

      const extendedLikesInfo = userId
        ? await this.getLikesInfoForAuthUser(postId, userId)
        : await this.getLikesInfoForNotAuthUser(postId);

      return PostOutputDtoMapper(post, extendedLikesInfo);
    } catch (e) {
      return null;
    }
  }

  public async getAll(
    query: PostQuery,
    params?: { blogId?: string },
    userId?: string,
  ): Promise<PostOutputPaginationDto> {
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

    const sortField = sortBy === 'blogName' ? 'blog_name' : 'created_at';

    let whereConditions = '';
    const queryParams: any[] = [];

    if (params?.blogId) {
      whereConditions = `blog_id = $1`;
      queryParams.push(params.blogId);
    } else {
      whereConditions = 'TRUE';
    }

    const collateClause = sortField === 'blog_name' ? 'COLLATE "C"' : '';

    const posts: Post[] = await this.dataSource.query(
      `
    SELECT *
    FROM
        posts 
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

    const postList = await Promise.all(
      posts.map(async (post) => {
        if (userId) {
          const extendedLikesInfo = await this.getLikesInfoForAuthUser(
            post.id,
            userId,
          );
          return PostOutputDtoMapper(post, extendedLikesInfo);
        } else {
          const extendedLikesInfo = await this.getLikesInfoForNotAuthUser(
            post.id,
          );
          return PostOutputDtoMapper(post, extendedLikesInfo);
        }
      }),
    );

    const totalCount = await this.dataSource.query(
      `
    SELECT COUNT(*)::int AS count
    FROM posts
    WHERE
        ${whereConditions}
    `,
      queryParams,
    );

    return PostOutputPaginationDtoMapper(
      postList,
      totalCount.at(0).count,
      Number(pageSize),
      Number(pageNumber),
    );
  }
}
