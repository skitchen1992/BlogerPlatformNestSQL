import { BlogDetails } from '@features/blogs/api/dto/BlogDetais';

export class BlogOutputDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

// MAPPERS

export const BlogOutputDtoMapper = (blog: BlogDetails): BlogOutputDto => {
  const outputDto = new BlogOutputDto();

  outputDto.id = blog.id;
  outputDto.name = blog.name;
  outputDto.description = blog.description;
  outputDto.websiteUrl = blog.website_url;
  outputDto.createdAt = blog.created_at.toISOString();
  outputDto.isMembership = blog.is_membership;

  return outputDto;
};
