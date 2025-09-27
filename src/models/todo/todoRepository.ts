import type { TodoItem } from '@/src/models/todo/todoEntity';

export interface TodoRepository {
  listenDaily(
    uid: string,
    dateKey: string,
    callback: (todos: Record<string, TodoItem>) => void,
  ): () => void;
}
