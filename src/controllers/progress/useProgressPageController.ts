'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import type { ProgressController, SaveProgressPayload } from '@/src/controllers/progress/progressController';
import { generateTodayCards, generateTomorrowCards, type ProgressCardData, type TomorrowPlanCard } from '@/src/models/progress/cardGenerators';
import type { Material } from '@/src/models/material/types';
import type { TodoItem } from '@/src/models/todo/todoEntity';

interface UseProgressPageControllerArgs {
  uid?: string | null;
  controller: ProgressController;
}

interface ProgressPageState {
  todayKey: string;
  todayDisplay: string;
  materials: Record<string, Material>;
  cards: ProgressCardData[];
  tomorrowCards: TomorrowPlanCard[];
  isLoading: boolean;
}

interface ProgressPageActions {
  saveProgress: (payload: Omit<SaveProgressPayload, 'materialId'> & { materialId: string }) => Promise<void>;
}

export function useProgressPageController({ uid, controller }: UseProgressPageControllerArgs) {
  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [todos, setTodos] = useState<Record<string, TodoItem>>({});
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [todosLoading, setTodosLoading] = useState(true);

  const todayKey = useMemo(() => dayjs().format('YYYYMMDD'), []);
  const todayDisplay = useMemo(() => dayjs().format('M/D(ddd)'), []);

  useEffect(() => {
    if (!uid) {
      setMaterials({});
      setMaterialsLoading(false);
      return;
    }

    setMaterialsLoading(true);
    const unsubscribe = controller.listenMaterials(uid, list => {
      const map = Object.fromEntries(list.map(item => [item.id, item]));
      setMaterials(map);
      setMaterialsLoading(false);
    });

    return unsubscribe;
  }, [uid, controller]);

  useEffect(() => {
    if (!uid) {
      setTodos({});
      setTodosLoading(false);
      return;
    }

    setTodosLoading(true);
    const unsubscribe = controller.listenTodos(uid, todayKey, items => {
      setTodos(items);
      setTodosLoading(false);
    });

    return unsubscribe;
  }, [uid, controller, todayKey]);

  const todoSnapshots = useMemo(
    () => Object.fromEntries(
      Object.entries(todos).map(([id, todo]) => [id, { doneStart: todo.doneStart, doneEnd: todo.doneEnd }]),
    ),
    [todos],
  );

  const cards = useMemo(
    () => generateTodayCards(materials, todoSnapshots),
    [materials, todoSnapshots],
  );

  const tomorrowCards = useMemo(
    () => generateTomorrowCards(materials, todoSnapshots),
    [materials, todoSnapshots],
  );

  const saveProgress = useCallback<ProgressPageActions['saveProgress']>(
    async ({ materialId, newStart, newEnd, prevStart, prevEnd }) => {
      if (!uid) return;
      if (newStart == null || newEnd == null) return;
      await controller.saveProgress(uid, { materialId, newStart, newEnd, prevStart, prevEnd });
    },
    [controller, uid],
  );

  const state: ProgressPageState = useMemo(
    () => ({
      todayKey,
      todayDisplay,
      materials,
      cards,
      tomorrowCards,
      isLoading: materialsLoading || todosLoading,
    }),
    [todayKey, todayDisplay, materials, cards, tomorrowCards, materialsLoading, todosLoading],
  );

  const actions: ProgressPageActions = useMemo(
    () => ({ saveProgress }),
    [saveProgress],
  );

  return { state, actions };
}
