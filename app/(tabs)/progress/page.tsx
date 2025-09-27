'use client';

import { useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '@/lib/firebase';
import { ProgressControllerProvider, useProgressController } from '@/src/controllers/progress/ProgressControllerProvider';
import { useProgressPageController } from '@/src/controllers/progress/useProgressPageController';
import { ProgressPageView } from '@/src/views/progress/ProgressPageView';

function ProgressPageContent() {
  const [user, authLoading] = useAuthState(auth);
  const controller = useProgressController();
  const { state, actions } = useProgressPageController({ uid: user?.uid, controller });

  const handleSave = useCallback(
    async ({ materialId, newStart, newEnd, prevStart, prevEnd }: {
      materialId: string;
      newStart: number;
      newEnd: number;
      prevStart: number | null;
      prevEnd: number | null;
    }) => {
      await actions.saveProgress({ materialId, newStart, newEnd, prevStart, prevEnd });
    },
    [actions],
  );

  if (authLoading) {
    return <p className="p-4">読み込み中...</p>;
  }

  if (!user) {
    return <p className="p-4">ログインしてください</p>;
  }

  return (
    <ProgressPageView
      todayDisplay={state.todayDisplay}
      cards={state.cards}
      tomorrowCards={state.tomorrowCards}
      isLoading={state.isLoading}
      onSave={handleSave}
    />
  );
}

export default function ProgressPage() {
  return (
    <ProgressControllerProvider>
      <ProgressPageContent />
    </ProgressControllerProvider>
  );
}
