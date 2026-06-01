import { ApiProperty } from '@nestjs/swagger';

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'validation_failed' })
  code!: string;

  @ApiProperty({ example: ['identifier should not be empty'], oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message!: string | string[];
}
