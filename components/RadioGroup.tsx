// components/RadioGroup.tsx
'use client';

interface RadioOption<T extends string> {
  label: string;
  value: T;
}

interface RadioGroupProps<T extends string> {
  /** 表示するラジオボタンの配列 */
  options: RadioOption<T>[];
  /** 現在選択されている値 */
  value: T;
  /** 変更ハンドラ */
  onChange: (value: T) => void;
  /** 追加クラス名（任意） */
  className?: string;
}

export default function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: RadioGroupProps<T>) {
  return (
    <div className={`flex gap-3 ${className}`.trim()}>
      {options.map(opt => (
        <label
          key={opt.value}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700"
        >
          <input
            type="radio"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 accent-indigo-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
