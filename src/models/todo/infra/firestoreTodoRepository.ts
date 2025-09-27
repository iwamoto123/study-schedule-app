import { collection, onSnapshot, type Firestore, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { TodoItem } from '@/src/models/todo/todoEntity';
import type { TodoRepository } from '@/src/models/todo/todoRepository';

export class FirestoreTodoRepository implements TodoRepository {
  constructor(private readonly firestore: Firestore = db) {}

  listenDaily(
    uid: string,
    dateKey: string,
    callback: (todos: Record<string, TodoItem>) => void,
  ): Unsubscribe {
    const col = collection(this.firestore, 'users', uid, 'todos', dateKey, 'items');

    return onSnapshot(col, snapshot => {
      const todos: Record<string, TodoItem> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        todos[docSnap.id] = {
          id: docSnap.id,
          title: (data.title as string) ?? '',
          subject: data.subject as TodoItem['subject'],
          unitType: data.unitType as TodoItem['unitType'],
          planCount: (data.planCount as number) ?? 0,
          plannedStart: data.plannedStart as number | undefined,
          plannedEnd: data.plannedEnd as number | undefined,
          totalStart: data.totalStart as number | undefined,
          totalEnd: data.totalEnd as number | undefined,
          doneStart: (data.doneStart as number | null | undefined) ?? null,
          doneEnd: (data.doneEnd as number | null | undefined) ?? null,
        };
      });
      callback(todos);
    });
  }
}
