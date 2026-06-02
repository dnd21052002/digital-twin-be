import { ApiProperty } from '@nestjs/swagger';

export class ViewPresetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  sceneId!: string | null;

  @ApiProperty()
  createdAt!: string;
}
