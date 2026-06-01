import { ApiProperty } from '@nestjs/swagger';

class RackPositionNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; }
class RowNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [RackPositionNodeDto] }) rackPositions!: RackPositionNodeDto[]; }
class ZoneNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [RowNodeDto] }) rows!: RowNodeDto[]; }
class HallNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [ZoneNodeDto] }) zones!: ZoneNodeDto[]; @ApiProperty({ type: [RowNodeDto] }) rows!: RowNodeDto[]; }
class FloorNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [HallNodeDto] }) halls!: HallNodeDto[]; }
class BuildingNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [FloorNodeDto] }) floors!: FloorNodeDto[]; }
class SiteNodeDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty({ type: [BuildingNodeDto] }) buildings!: BuildingNodeDto[]; }

export class FacilityTreeResponseDto { @ApiProperty({ type: [SiteNodeDto] }) sites!: SiteNodeDto[]; }
