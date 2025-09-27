export interface ProgressRepository {
  updateTodoItem(params: {
    uid: string;
    dateKey: string; // YYYYMMDD
    materialId: string;
    doneStart: number;
    doneEnd: number;
  }): Promise<void>;

  incrementMaterialCompleted(params: {
    uid: string;
    materialId: string;
    delta: number;
  }): Promise<number>; // returns updated completed value (after)

  setMaterialLog(params: {
    uid: string;
    materialId: string;
    dateKey: string; // YYYYMMDD
    dateISO: string; // YYYY-MM-DD
    doneAfter: number;
  }): Promise<void>;
}

