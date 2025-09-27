'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { GraphController } from '@/src/controllers/graph/graphController';
import { FirestoreMaterialRepository } from '@/src/models/material/infra/firestoreMaterialRepository';
import { FirestoreProgressLogRepository } from '@/src/models/progress/infra/firestoreProgressLogRepository';

interface Props {
  children: ReactNode;
  controller?: GraphController;
}

const GraphControllerContext = createContext<GraphController | null>(null);

export function GraphControllerProvider({ children, controller }: Props) {
  const value = useMemo(() => {
    if (controller) return controller;
    const materialRepository = new FirestoreMaterialRepository();
    const logRepository = new FirestoreProgressLogRepository();
    return new GraphController(materialRepository, logRepository);
  }, [controller]);

  return (
    <GraphControllerContext.Provider value={value}>
      {children}
    </GraphControllerContext.Provider>
  );
}

export function useGraphController(): GraphController {
  const ctx = useContext(GraphControllerContext);
  if (!ctx) throw new Error('useGraphController must be used within GraphControllerProvider');
  return ctx;
}
