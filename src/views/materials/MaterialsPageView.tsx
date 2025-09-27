'use client';

import MaterialForm, { type MaterialFormValues } from '@/components/MaterialForm';
import StudyMaterialCard from '@/components/StudyMaterialCard';
import type { Material } from '@/src/models/material/types';

interface MaterialsPageViewProps {
  materials: Material[];
  editing: Material | null;
  isLoading: boolean;
  onEdit: (material: Material) => void;
  onCloseEditor: () => void;
  onDelete: (material: Material) => Promise<void>;
  onCreate: (values: MaterialFormValues) => Promise<void>;
  onUpdate: (id: string, values: MaterialFormValues) => Promise<void>;
}

export function MaterialsPageView({
  materials,
  editing,
  isLoading,
  onEdit,
  onCloseEditor,
  onDelete,
  onCreate,
  onUpdate,
}: MaterialsPageViewProps) {
  return (
    <main className="mx-auto max-w-md space-y-8 p-4">
      <h1 className="text-xl font-bold">新しい参考書を登録</h1>

      <MaterialForm
        mode="create"
        onSubmit={onCreate}
        onSuccess={onCloseEditor}
      />

      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={onCloseEditor}
        >
          <div
            className="w-full max-w-md"
            onClick={event => event.stopPropagation()}
          >
            <MaterialForm
              mode="update"
              initialValues={editing}
              onSubmit={values => onUpdate(editing.id, values)}
              onSuccess={onCloseEditor}
              onCancel={onCloseEditor}
            />
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">登録済みの参考書</h2>

        {isLoading && (
          <p className="text-sm text-gray-500">読み込み中...</p>
        )}

        {!isLoading && materials.length === 0 && (
          <p className="text-sm text-gray-500">登録済みの参考書はありません</p>
        )}

        {materials.map(material => (
          <StudyMaterialCard
            key={material.id}
            id={material.id}
            title={material.title}
            subject={material.subject}
            unitType={material.unitType}
            totalCount={material.totalCount}
            planCount={material.dailyPlan}
            done={material.completed}
            startDate={material.startDate}
            deadline={material.deadline}
            editable={false}
            onEdit={() => onEdit(material)}
            onDelete={() => onDelete(material)}
          />
        ))}
      </section>
    </main>
  );
}
