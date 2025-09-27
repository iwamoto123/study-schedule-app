'use client';

import { useEffect, useMemo, useState } from 'react';

import type { GraphController } from '@/src/controllers/graph/graphController';
import { buildGraphPoints, filterToIsoWeek, type GraphDataPoint } from '@/src/models/progress/graphBuilder';
import type { Material } from '@/src/models/material/types';

interface UseGraphPageControllerArgs {
  uid?: string | null;
  controller: GraphController;
}

interface GraphPageState {
  materials: Material[];
  graphs: Record<string, GraphDataPoint[]>;
  isLoading: boolean;
}

interface GraphPageActions {
  toWeekly: (points: GraphDataPoint[]) => GraphDataPoint[];
}

export function useGraphPageController({ uid, controller }: UseGraphPageControllerArgs) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [graphs, setGraphs] = useState<Record<string, GraphDataPoint[]>>({});
  const [materialsLoading, setMaterialsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMaterials([]);
      setMaterialsLoading(false);
      return;
    }

    setMaterialsLoading(true);
    const unsubscribe = controller.listenMaterials(uid, list => {
      setMaterials(list);
      setMaterialsLoading(false);
    });

    return unsubscribe;
  }, [uid, controller]);

  useEffect(() => {
    if (!uid) {
      setGraphs({});
      return;
    }

    setGraphs({});
    const unsubscribers = materials.map(material =>
      controller.listenLogs(uid, material.id, logs => {
        setGraphs(prev => ({
          ...prev,
          [material.id]: buildGraphPoints(material, logs),
        }));
      }),
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [uid, controller, materials]);

  const state: GraphPageState = useMemo(
    () => ({ materials, graphs, isLoading: materialsLoading }),
    [materials, graphs, materialsLoading],
  );

  const actions: GraphPageActions = useMemo(
    () => ({ toWeekly: filterToIsoWeek }),
    [],
  );

  return { state, actions };
}
