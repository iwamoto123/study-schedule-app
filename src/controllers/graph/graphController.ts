import type { Material } from '@/src/models/material/types';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { ProgressLog, ProgressLogRepository } from '@/src/models/progress/progressLogRepository';

export class GraphController {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly logRepository: ProgressLogRepository,
  ) {}

  listenMaterials(uid: string, callback: (materials: Material[]) => void): () => void {
    return this.materialRepository.listenAll(uid, callback);
  }

  listenLogs(uid: string, materialId: string, callback: (logs: ProgressLog[]) => void): () => void {
    return this.logRepository.listen(uid, materialId, callback);
  }
}
