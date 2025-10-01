import { IsString, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateCategoryDto {
  @ApiProperty({ 
    description: 'ID danh mục'
  })
  @IsString()
  id: string;

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

  @ApiProperty({ 
    description: 'Hình ảnh danh mục'
  })
  @IsString()
  image: string;

  @ApiProperty({ 
    description: 'Trạng thái kích hoạt'
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ 
    description: 'ID danh mục cha'
  })
  @IsString()
  parentId: string;
}
