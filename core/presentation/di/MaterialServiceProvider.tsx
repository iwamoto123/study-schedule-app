'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { MaterialService, MaterialServiceImpl } from '@/core/application/services/MaterialService';
import { MaterialRepository } from '@/core/application/ports/MaterialRepository';
import { MaterialRepositoryFirestore } from '@/core/infrastructure/firestore/MaterialRepositoryFirestore';

const MaterialServiceCtx = createContext<MaterialService | null>(null);

export function MaterialServiceProvider({ children, repo, service: provided }:
  { children: React.ReactNode; repo?: MaterialRepository; service?: MaterialService }) {
  const service = useMemo(() => provided ?? new MaterialServiceImpl(repo ?? new MaterialRepositoryFirestore()), [provided, repo]);
  return <MaterialServiceCtx.Provider value={service}>{children}</MaterialServiceCtx.Provider>;
}

export function useMaterialService(): MaterialService {
  const ctx = useContext(MaterialServiceCtx);
  if (!ctx) throw new Error('MaterialService not provided');
  return ctx;
}
