///型定義（TypeScript）
// types/react-mobile-picker.d.ts
declare module 'react-mobile-picker' {
  import * as React from 'react';

  export interface PickerProps {
    /** { 列キー: ['1', '2', ...] } の形  */
    data: Record<string, string[]>;
    /** { 列キー: '選択中の値' } */
    value: Record<string, string>;
    /** 値が変わったとき */
    onChange?: (columnKey: string, value: string) => void;
    wheelHeight?: number;
    optionHeight?: number;
    className?: string;
    style?: React.CSSProperties;
  }

  /** 1D / 2D ホイールピッカー */
  const Picker: React.FC<PickerProps>;
  export default Picker;
}

