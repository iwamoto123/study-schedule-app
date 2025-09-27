'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '@/lib/firebase';
import { GraphControllerProvider, useGraphController } from '@/src/controllers/graph/GraphControllerProvider';
import { useGraphPageController } from '@/src/controllers/graph/useGraphPageController';
import { GraphPageView } from '@/src/views/graph/GraphPageView';

function GraphPageContent() {
  const [user, authLoading] = useAuthState(auth);
  const controller = useGraphController();
  const { state, actions } = useGraphPageController({ uid: user?.uid, controller });
  const [range, setRange] = useState<'all' | 'week'>('all');

  if (authLoading) {
    return <p className="p-4">読み込み中...</p>;
  }

  if (!user) {
    return <p className="p-4">ログインしてください</p>;
  }

  return (
    <GraphPageView
      materials={state.materials}
      graphs={state.graphs}
      range={range}
      onRangeChange={setRange}
      toWeekly={actions.toWeekly}
      isLoading={state.isLoading}
    />
  );
}

export default function ProgressGraphPage() {
  return (
    <GraphControllerProvider>
      <GraphPageContent />
    </GraphControllerProvider>
  );
}
