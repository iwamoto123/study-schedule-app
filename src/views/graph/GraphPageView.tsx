'use client';

import classNames from 'classnames';

import GraphCard, { type GraphDataPoint } from '@/components/GraphCard';
import type { Material } from '@/src/models/material/types';

interface GraphPageViewProps {
  materials: Material[];
  graphs: Record<string, GraphDataPoint[]>;
  range: 'all' | 'week';
  onRangeChange: (range: 'all' | 'week') => void;
  toWeekly: (points: GraphDataPoint[]) => GraphDataPoint[];
  isLoading: boolean;
}

export function GraphPageView({
  materials,
  graphs,
  range,
  onRangeChange,
  toWeekly,
  isLoading,
}: GraphPageViewProps) {
  return (
    <main className="mx-auto w-full max-w-none space-y-8 p-4 md:max-w-3xl">
      <h1 className="text-xl font-bold">進捗グラフ</h1>

      <div className="mb-6 flex space-x-2 border-b">
        {(['all', 'week'] as const).map(option => (
          <button
            key={option}
            onClick={() => onRangeChange(option)}
            className={classNames(
              'px-4 py-2 text-sm font-semibold',
              range === option
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-400 hover:text-indigo-600',
            )}
          >
            {option === 'all' ? '全期間' : '1週間'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">読み込み中...</p>}

      {materials.map(material => {
        const points = graphs[material.id] ?? [];
        const data = range === 'all' ? points : toWeekly(points);
        return <GraphCard key={material.id} material={material} data={data} />;
      })}

      {!isLoading && materials.length === 0 && (
        <p className="text-center text-sm text-gray-500">登録された教材がありません</p>
      )}
    </main>
  );
}
