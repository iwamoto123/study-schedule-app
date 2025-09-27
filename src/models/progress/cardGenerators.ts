import dayjs from 'dayjs';

import { calcTodayPlan } from '@/src/models/progress/calcTodayPlan';
import type { Material } from '@/src/models/material/types';
import type { TodoItem } from '@/src/models/todo/todoEntity';

export interface ProgressCardData {
  id: string;
  title: string;
  subject: string;
  unitType: string;
  totalStart: number;
  totalEnd: number;
  plannedStart: number;
  plannedEnd: number;
  doneStart: number | null;
  doneEnd: number | null;
  prevStart: number | null;
  prevEnd: number | null;
}

export interface TomorrowPlanCard {
  id: string;
  title: string;
  subject: string;
  unitType: string;
  planStart: number;
  planEnd: number;
}

export type MaterialMap = Record<string, Material>;
export type TodoMap = Record<string, Pick<TodoItem, 'doneStart' | 'doneEnd'>>;

const doneCount = (todo?: Pick<TodoItem, 'doneStart' | 'doneEnd'>) =>
  todo?.doneStart != null && todo.doneEnd != null
    ? todo.doneEnd - todo.doneStart + 1
    : 0;

export function generateTodayCards(materials: MaterialMap, todos: TodoMap): ProgressCardData[] {
  return Object.values(materials).map(material => {
    const todo = todos[material.id];

    const todayDone = doneCount(todo);
    const completedStart = Math.max(0, (material.completed ?? 0) - todayDone);

    const todayPlan = calcTodayPlan({
      totalCount: material.totalCount,
      completed: completedStart,
      deadline: material.deadline,
    });

    const plannedStart = completedStart + 1;
    const plannedEnd = Math.min(plannedStart + todayPlan - 1, material.totalCount);

    return {
      id: material.id,
      title: material.title,
      subject: material.subject,
      unitType: material.unitType,
      totalStart: 1,
      totalEnd: material.totalCount,
      plannedStart,
      plannedEnd,
      doneStart: todo?.doneStart ?? null,
      doneEnd: todo?.doneEnd ?? null,
      prevStart: todo?.doneStart ?? null,
      prevEnd: todo?.doneEnd ?? null,
    };
  });
}

export function generateTomorrowCards(materials: MaterialMap, todos: TodoMap): TomorrowPlanCard[] {
  return Object.values(materials).flatMap(material => {
    const todo = todos[material.id];
    const todayDone = doneCount(todo);
    const baseCompleted = material.completed ?? 0;

    const todayPlan = calcTodayPlan({
      totalCount: material.totalCount,
      completed: baseCompleted,
      deadline: material.deadline,
    });

    const completedAfterToday = todayDone > 0 ? baseCompleted : baseCompleted + todayPlan;
    if (completedAfterToday >= material.totalCount) return [];

    const planCount = calcTodayPlan(
      {
        totalCount: material.totalCount,
        completed: completedAfterToday,
        deadline: material.deadline,
      },
      dayjs().add(1, 'day'),
    );

    const planStart = completedAfterToday + 1;
    const planEnd = Math.min(planStart + planCount - 1, material.totalCount);

    return [{
      id: material.id,
      title: material.title,
      subject: material.subject,
      unitType: material.unitType,
      planStart,
      planEnd,
    }];
  });
}
