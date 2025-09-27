'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MaterialsController } from '@/src/controllers/materials/materialsController';
import type { Material } from '@/src/models/material/types';
import type { CreateMaterialInput } from '@/src/models/material/materialService';

interface UseMaterialsPageControllerArgs {
  uid?: string | null;
  controller: MaterialsController;
}

interface MaterialsPageState {
  materials: Material[];
  editing: Material | null;
  isLoading: boolean;
}

interface MaterialsPageActions {
  startEditing: (material: Material) => void;
  clearEditing: () => void;
  createMaterial: (payload: Omit<CreateMaterialInput, 'uid'>) => Promise<void>;
  updateMaterial: (id: string, payload: Partial<CreateMaterialInput>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}

export function useMaterialsPageController({ uid, controller }: UseMaterialsPageControllerArgs) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editing, setEditing] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMaterials([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const unsubscribe = controller.listenAll(uid, items => {
      setMaterials(items);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [uid, controller]);

  const startEditing = useCallback((material: Material) => {
    setEditing(material);
  }, []);

  const clearEditing = useCallback(() => {
    setEditing(null);
  }, []);

  const createMaterial = useCallback<MaterialsPageActions['createMaterial']>(
    async payload => {
      if (!uid) throw new Error('uid is required to create a material');
      await controller.create(uid, payload);
    },
    [controller, uid],
  );

  const updateMaterial = useCallback<MaterialsPageActions['updateMaterial']>(
    async (id, payload) => {
      if (!uid) throw new Error('uid is required to update a material');
      await controller.update(uid, id, payload);
    },
    [controller, uid],
  );

  const deleteMaterial = useCallback<MaterialsPageActions['deleteMaterial']>(
    async id => {
      if (!uid) throw new Error('uid is required to delete a material');
      await controller.delete(uid, id);
    },
    [controller, uid],
  );

  const state: MaterialsPageState = useMemo(
    () => ({ materials, editing, isLoading }),
    [materials, editing, isLoading],
  );

  const actions: MaterialsPageActions = useMemo(
    () => ({ startEditing, clearEditing, createMaterial, updateMaterial, deleteMaterial }),
    [startEditing, clearEditing, createMaterial, updateMaterial, deleteMaterial],
  );

  return { state, actions };
}
