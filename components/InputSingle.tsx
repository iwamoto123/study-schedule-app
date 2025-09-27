// components/InputSingle.tsx
'use client';

import * as React from 'react';

interface InputSingleProps {
  value: number;
  onChange?: (n: number) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const InputSingle = React.forwardRef<HTMLInputElement, InputSingleProps>(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      placeholder = '0',
      className = '',
      readOnly = false,
    },
    ref,
  ) => (
    <input
      ref={ref}
      type="number"
      min={0}
      name={name}
      readOnly={readOnly || !onChange}
      value={value === 0 && onChange ? '' : value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(Number(e.target.value))}
      onBlur={onBlur}
      className={`w-20 rounded-md border border-gray-300 px-2 py-1 text-sm 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                 disabled:bg-gray-100 ${className}`.trim()}
    />
  ),
);

InputSingle.displayName = 'InputSingle';

export default InputSingle;
