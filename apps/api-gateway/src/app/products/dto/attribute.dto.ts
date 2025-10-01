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