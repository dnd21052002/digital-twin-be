import { AssetsService } from './assets.service';

describe('AssetsService', () => {
  it('uses the last emitted asset id as nextCursor', async () => {
    const repository = {
      listAssets: jest.fn().mockResolvedValue([
        makeSummaryRow('asset-001'),
        makeSummaryRow('asset-002'),
        makeSummaryRow('asset-003'),
      ]),
    };
    const service = new AssetsService(repository as never);

    await expect(service.listAssets({ limit: 2 })).resolves.toMatchObject({
      items: [{ id: 'asset-001' }, { id: 'asset-002' }],
      nextCursor: 'asset-002',
    });
  });

  it('maps detail geometry coordinates from repository rows', async () => {
    const coordinates = { type: 'Point', coordinates: [123.45, 67.89] };
    const repository = {
      getAsset: jest.fn().mockResolvedValue({
        ...makeSummaryRow('asset-001'),
        category_name: 'Server',
        model_id: null,
        manufacturer: null,
        model_code: null,
        model_display_name: null,
        default_power_kw: null,
        default_cooling_kw: null,
        rack_units: null,
        weight_kg: null,
        mesh_id: null,
        spec_json: null,
        serial_no: 'SN-001',
        site_name: null,
        building_name: null,
        floor_name: null,
        hall_name: null,
        zone_name: null,
        row_name: null,
        rack_position_name: null,
        rotation_deg: '90',
        coordinates,
        attributes: { owner: 'ops' },
      }),
    };
    const service = new AssetsService(repository as never);

    await expect(service.getAsset('asset-001')).resolves.toMatchObject({
      geometry: {
        rotationDeg: 90,
        coordinates,
      },
    });
  });
});

function makeSummaryRow(id: string) {
  return {
    id,
    asset_tag: `TAG-${id}`,
    name: `Asset ${id}`,
    category: 'server',
    status: 'active',
    site_id: null,
    building_id: null,
    floor_id: null,
    hall_id: null,
    zone_id: null,
    row_id: null,
    rack_position_id: null,
  };
}
