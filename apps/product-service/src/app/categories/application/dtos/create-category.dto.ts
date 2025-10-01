import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateCategoryDto {
  @ApiProperty({ 
    description: 'Tên danh mục',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ 
    description: 'Slug danh mục'
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ 
    description: 'Hình ảnh danh mục'
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiPropertyOptional({ 
    description: 'Trạng thái kích hoạt'
  })
  @IsOptional()
  @IsBoolean()
  active: boolean;

  @ApiPropertyOptional({ 
    description: 'ID danh mục cha'
  })
  @IsOptional()
  @IsString()
  parentId: string;
}
