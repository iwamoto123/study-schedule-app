'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { ProgressController } from '@/src/controllers/progress/progressController';
import { FirestoreMaterialRepository } from '@/src/models/material/infra/firestoreMaterialRepository';
import { ProgressServiceImpl } from '@/src/models/progress/progressService';
import { ProgressRepositoryFirestore } from '@/src/models/progress/infra/firestoreProgressRepository';
import { FirestoreTodoRepository } from '@/src/models/todo/infra/firestoreTodoRepository';

interface Props {
  children: ReactNode;
  controller?: ProgressController;
}

const ProgressControllerContext = createContext<ProgressController | null>(null);

export function ProgressControllerProvider({ children, controller }: Props) {
  const value = useMemo(() => {
    if (controller) return controller;

    const materialRepository = new FirestoreMaterialRepository();
    const todoRepository = new FirestoreTodoRepository();
    const progressRepository = new ProgressRepositoryFirestore();
    const service = new ProgressServiceImpl(progressRepository);

    return new ProgressController(service, materialRepository, todoRepository);
  }, [controller]);

  return (
    <ProgressControllerContext.Provider value={value}>
      {children}
    </ProgressControllerContext.Provider>
  );
}

export function useProgressController(): ProgressController {
  const ctx = useContext(ProgressControllerContext);
  if (!ctx) throw new Error('useProgressController must be used within ProgressControllerProvider');
  return ctx;
}
