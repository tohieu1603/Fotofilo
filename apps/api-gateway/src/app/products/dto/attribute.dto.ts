import { ApiProperty } from '@nestjs/swagger';

export interface AttributeDto {
  attributeOptionId: string;
  attributeOptionValue: string;
  attribute: {
    id: string;
    name: string;
    description?: string;
  };
}


export class AttributeOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class GetAttributeOptionsResponseDto {
  @ApiProperty()
  attributeId: string;

  @ApiProperty()
  attributeName: string;

  @ApiProperty({ type: [AttributeOptionDto] })
  options: AttributeOptionDto[];
}
