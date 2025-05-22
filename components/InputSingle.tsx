// components/InputSingle.tsx
'use client';

interface InputSingleProps {
  /** 入力値。0 のときは空欄表示にしたい場合が多い */
  value: number;
  /** 値が変わったら呼ばれる。undefined のとき read-only モード */
  onChange?: (n: number) => void;
  /** 何も入力されていないときのプレースホルダ */
  placeholder?: string;
  /** 追加の Tailwind クラスを渡したい場合 */
  className?: string;
  readOnly?: boolean;  
}

export default function InputSingle({
  value,
  onChange,
  placeholder = '0',
  className = '',
  readOnly = false,
}: InputSingleProps) {
  return (
    <input
      type="number"
      min={0}
      readOnly={readOnly || !onChange}
      value={value === 0 && onChange ? '' : value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(Number(e.target.value))}
      className={`w-20 rounded-md border border-gray-300 px-2 py-1 text-sm 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                 disabled:bg-gray-100 ${className}`.trim()}
    />
  );
}
