export interface ProgressLog {
  date: string;
  done: number;
}

export interface ProgressLogRepository {
  listen(
    uid: string,
    materialId: string,
    callback: (logs: ProgressLog[]) => void,
  ): () => void;
}
