"use client";
import { ReactNode } from "react";

interface RadioOption<T extends string> {
  label: string;
  value: T;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: RadioGroupProps<T>) {
  return (
    <div className={`flex gap-3 ${className}`.trim()}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 cursor-pointer"
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