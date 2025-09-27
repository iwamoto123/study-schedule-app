'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { MaterialsController } from '@/src/controllers/materials/materialsController';
import { MaterialServiceImpl } from '@/src/models/material/materialService';
import { FirestoreMaterialRepository } from '@/src/models/material/infra/firestoreMaterialRepository';

interface Props {
  children: ReactNode;
  controller?: MaterialsController;
}

const MaterialsControllerContext = createContext<MaterialsController | null>(null);

export function MaterialsControllerProvider({ children, controller }: Props) {
  const value = useMemo(() => {
    if (controller) return controller;
    const repository = new FirestoreMaterialRepository();
    const service = new MaterialServiceImpl(repository);
    return new MaterialsController(service, repository);
  }, [controller]);

  return (
    <MaterialsControllerContext.Provider value={value}>
      {children}
    </MaterialsControllerContext.Provider>
  );
}

export function useMaterialsController(): MaterialsController {
  const ctx = useContext(MaterialsControllerContext);
  if (!ctx) throw new Error('useMaterialsController must be used within MaterialsControllerProvider');
  return ctx;
}
