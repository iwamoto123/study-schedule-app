'use client';

import { useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import type { Material } from '@/src/models/material/types';
import { auth } from '@/lib/firebase';
import type { MaterialFormValues } from '@/components/MaterialForm';
import { MaterialsControllerProvider, useMaterialsController } from '@/src/controllers/materials/MaterialsControllerProvider';
import { useMaterialsPageController } from '@/src/controllers/materials/useMaterialsPageController';
import { MaterialsPageView } from '@/src/views/materials/MaterialsPageView';

function MaterialsPageContent() {
  const [user, authLoading] = useAuthState(auth);
  const controller = useMaterialsController();
  const { state, actions } = useMaterialsPageController({ uid: user?.uid, controller });

  const handleCreate = useCallback(
    async (values: MaterialFormValues) => {
      await actions.createMaterial(values);
    },
    [actions],
  );

  const handleUpdate = useCallback(
    async (materialId: string, values: MaterialFormValues) => {
      await actions.updateMaterial(materialId, values);
    },
    [actions],
  );

  const handleDelete = useCallback(
    async (material: Material) => {
      if (!user) return;
      if (!window.confirm(`「${material.title}」を削除します。よろしいですか？`)) return;
      await actions.deleteMaterial(material.id);
    },
    [actions, user],
  );

  if (authLoading) {
    return <p className="p-4">読み込み中...</p>;
  }

  if (!user) {
    return <p className="p-4">ログインしてください</p>;
  }

  return (
    <MaterialsPageView
      materials={state.materials}
      editing={state.editing}
      isLoading={state.isLoading}
      onEdit={actions.startEditing}
      onCloseEditor={actions.clearEditing}
      onDelete={handleDelete}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    />
  );
}

export default function MaterialsPage() {
  return (
    <MaterialsControllerProvider>
      <MaterialsPageContent />
    </MaterialsControllerProvider>
  );
}
