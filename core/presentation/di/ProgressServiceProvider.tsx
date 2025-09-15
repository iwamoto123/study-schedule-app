'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { ProgressService, ProgressServiceImpl } from '@/core/application/services/ProgressService';
import { ProgressRepository } from '@/core/application/ports/ProgressRepository';
import { ProgressRepositoryFirestore } from '@/core/infrastructure/firestore/ProgressRepositoryFirestore';

const Ctx = createContext<ProgressService | null>(null);

export function ProgressServiceProvider({ children, repo, service }: { children: React.ReactNode; repo?: ProgressRepository; service?: ProgressService }) {
  const value = useMemo(() => service ?? new ProgressServiceImpl(repo ?? new ProgressRepositoryFirestore()), [service, repo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgressService(): ProgressService {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('ProgressService not provided');
  return ctx;
}

