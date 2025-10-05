import { ApiProperty } from '@nestjs/swagger';

export class BrandDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
