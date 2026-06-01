export interface SceneSummary {
  id: string;
  siteId: string;
  name: string;
  isDefault: boolean;
  lodStrategy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenesResponse {
  items: SceneSummary[];
}

export interface MeshAssetManifest {
  id: string;
  name: string;
  format: string;
  lodLevel: number;
  storageUrl: string;
  boundingBox: unknown;
  attributes: unknown;
}

export interface TextureAssetManifest {
  id: string;
  name: string;
  storageUrl: string;
  widthPx: number | null;
  heightPx: number | null;
  channels: number | null;
  encoding: string | null;
}

export interface SceneManifest {
  scene: SceneSummary & { environment: unknown; defaultCameraId: string | null };
  meshes: MeshAssetManifest[];
  textures: TextureAssetManifest[];
}
