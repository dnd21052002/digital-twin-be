import { Injectable, NotFoundException } from '@nestjs/common';
import { SceneManifest, ScenesResponse } from './scenes.types';
import { ScenesRepository } from './scenes.repository';

@Injectable()
export class ScenesService {
  constructor(private readonly repository: ScenesRepository) {}

  listScenes(): Promise<ScenesResponse> {
    return this.repository.listScenes();
  }

  async getSceneManifest(sceneId: string): Promise<SceneManifest> {
    const manifest = await this.repository.getSceneManifest(sceneId);
    if (!manifest) throw new NotFoundException('Scene not found');
    return manifest;
  }
}
