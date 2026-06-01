import { readFileSync } from 'fs';
import { join } from 'path';

describe('AssetsRepository SQL', () => {
  it('selects asset detail geometry coordinates from PostGIS geom', () => {
    const source = readFileSync(join(__dirname, 'assets.repository.ts'), 'utf8');

    expect(source).toContain('ST_AsGeoJSON(a.geom)::json AS coordinates');
    expect(source).not.toContain('NULL::json AS coordinates');
  });
});
