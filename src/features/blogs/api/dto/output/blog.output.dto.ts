import { BlogDocument } from '../../../domain/blog.entity';

export class BlogOutputDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

// MAPPERS

export const BlogOutputDtoMapper = (blog: BlogDocument): BlogOutputDto => {
  const outputDto = new BlogOutputDto();

  outputDto.id = blog._id.toString();
  outputDto.name = blog.name;
  outputDto.description = blog.description;
  outputDto.websiteUrl = blog.websiteUrl;
  outputDto.createdAt = blog.createdAt;
  outputDto.isMembership = blog.isMembership;

  return outputDto;
};
