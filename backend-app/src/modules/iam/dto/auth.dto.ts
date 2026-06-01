import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Username or email address.' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'Admin@123456' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'opaque-refresh-token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin' })
  username!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: 'Admin', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: 'AD', nullable: true })
  avatarInitials!: string | null;

  @ApiProperty({ example: ['ADMIN'], type: [String] })
  roles!: string[];

  @ApiProperty({ example: ['asset:read', 'alarm:read'], type: [String] })
  permissions!: string[];
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'opaque-refresh-token' })
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}
