//components/RangeSlider.tsx

import React, { useRef, useCallback } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: { start: number; end: number };
  color?: string;
  onChange: (value: { start: number; end: number }) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  color = 'bg-blue-500',
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(
    (val: number): number => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const calculateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min;
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + percent * (max - min));
    },
    [min, max]
  );

  const handleDrag = (type: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const moveListener = (clientX: number) => {
      const newValue = calculateValue(clientX);
      if (type === 'start') {
        const safe = Math.min(newValue, value.end);
        onChange({ start: safe, end: value.end });
      } else {
        const safe = Math.max(newValue, value.start);
        onChange({ start: value.start, end: safe });
      }
    };

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      moveListener(clientX);
    };

    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.removeEventListener('touchend', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchend', upHandler);
  };

  return (
    <div className="w-full p-4">
      <div className="relative">
        <div className="flex justify-between mb-2 text-sm text-gray-600">
          <span>{min}</span>
          <span>{max}</span>
        </div>

        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full"
          style={{ touchAction: 'none' }}
        >
          <div
            className={`absolute h-full rounded-full ${color}`}
            style={{
              left: `${calculatePosition(value.start)}%`,
              width: `${calculatePosition(value.end) - calculatePosition(value.start)}%`,
            }}
          />
          {(['start', 'end'] as const).map((type) => (
            <div
              key={type}
              className="absolute top-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab shadow-md -translate-y-1/2"
              style={{
                left: `${calculatePosition(value[type])}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={handleDrag(type)}
              onTouchStart={handleDrag(type)}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded">
                {value[type]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;


// import React, { useState, useRef, useEffect, useCallback } from 'react';

// interface RangeSliderProps {
//   min?: number;
//   max?: number;
//   initialStart?: number;
//   initialEnd?: number;
//   value?: { start: number; end: number }; 
//   color?: string;
//   onChange?: (values: { start: number; end: number }) => void;
// }

// const RangeSlider: React.FC<RangeSliderProps> = ({
//   min = 0,
//   max = 100,
//   initialStart = 20,
//   initialEnd = 80,
//   value,
//   color = 'bg-blue-500',
//   onChange,
// }) => {
//   const [start, setStart] = useState<number>(value?.start ?? initialStart);
//   const [end, setEnd] = useState<number>(value?.end ?? initialEnd);
//   const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

//   const sliderRef = useRef<HTMLDivElement>(null);
//   const startRef = useRef<number>(start);
//   const endRef = useRef<number>(end);

//   useEffect(() => {
//   if (!isDragging) {
//     onChange?.({ start, end });
//   }
// }, [start, end, isDragging, onChange]);


//   // 外部からの value を内部 state に反映
//   useEffect(() => {
//     if (value) {
//       setStart(value.start);
//       setEnd(value.end);
//     }
//   }, [value]);

//   // internal ref 更新
//   useEffect(() => {
//     startRef.current = start;
//     endRef.current = end;
//   }, [start, end]);

//   // onChange 実行
//   useEffect(() => {
//     onChange?.({ start, end });
//   }, [start, end, onChange]);

//   const calculatePosition = useCallback(
//     (value: number): number => ((value - min) / (max - min)) * 100,
//     [min, max]
//   );

//   const calculateValue = useCallback(
//     (clientX: number): number => {
//       if (!sliderRef.current) return min;
//       const rect = sliderRef.current.getBoundingClientRect();
//       const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
//       return Math.round(min + percent * (max - min));
//     },
//     [min, max]
//   );

//   const handleMouseDown = useCallback(
//     (type: 'start' | 'end') => (e: React.MouseEvent) => {
//       e.preventDefault();
//       setIsDragging(type);
//     },
//     []
//   );

//   const handleMouseMove = useCallback(
//     (e: MouseEvent) => {
//       if (!isDragging) return;
//       const newValue = calculateValue(e.clientX);
//       if (isDragging === 'start') {
//         setStart(Math.min(newValue, endRef.current));
//       } else if (isDragging === 'end') {
//         setEnd(Math.max(newValue, startRef.current));
//       }
//     },
//     [isDragging, calculateValue]
//   );

//   const handleMouseUp = useCallback(() => {
//     setIsDragging(null);
//   }, []);

//   const handleTouchStart = useCallback(
//     (type: 'start' | 'end') => (e: React.TouchEvent) => {
//       e.stopPropagation();
//       setIsDragging(type);
//     },
//     []
//   );

//   const handleTouchMove = useCallback(
//     (e: TouchEvent) => {
//       if (!isDragging) return;
//       const touch = e.touches[0];
//       const newValue = calculateValue(touch.clientX);
//       if (isDragging === 'start') {
//         setStart(Math.min(newValue, endRef.current));
//       } else if (isDragging === 'end') {
//         setEnd(Math.max(newValue, startRef.current));
//       }
//     },
//     [isDragging, calculateValue]
//   );

//   const handleTouchEnd = useCallback(() => {
//     setIsDragging(null);
//   }, []);

//   useEffect(() => {
//     if (!isDragging) return;

//     const options: AddEventListenerOptions = { passive: true };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);

//     document.addEventListener('touchmove', handleTouchMove, options);
//     document.addEventListener('touchend', handleTouchEnd, options);

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//       document.removeEventListener('touchmove', handleTouchMove);
//       document.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

//   return (
//     <div className="w-full p-4">
//       <div className="relative">
//         {/* ラベル */}
//         <div className="flex justify-between mb-2 text-sm text-gray-600">
//           <span>{min}</span>
//           <span>{max}</span>
//         </div>

//         {/* スライダー本体 */}
//         <div
//           ref={sliderRef}
//           className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
//           style={{ touchAction: 'none' }}
//         >
//           {/* 選択範囲 */}
//           <div
//             className={`absolute h-full rounded-full ${color}`}
//             style={{
//               left: `${calculatePosition(start)}%`,
//               width: `${calculatePosition(end) - calculatePosition(start)}%`,
//             }}
//           />

//           {/* start ハンドル */}
//           <div
//             className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab shadow-md transition-transform ${
//               isDragging === 'start' ? 'scale-110 border-blue-500' : 'hover:scale-105'
//             }`}
//             style={{
//               left: `${calculatePosition(start)}%`,
//               transform: 'translate(-50%, -50%)',
//               touchAction: 'none',
//             }}
//             onMouseDown={handleMouseDown('start')}
//             onTouchStart={handleTouchStart('start')}
//           >
//             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
//               {start}
//             </div>
//           </div>

//           {/* end ハンドル */}
//           <div
//             className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab shadow-md transition-transform ${
//               isDragging === 'end' ? 'scale-110 border-blue-500' : 'hover:scale-105'
//             }`}
//             style={{
//               left: `${calculatePosition(end)}%`,
//               transform: 'translate(-50%, -50%)',
//               touchAction: 'none',
//             }}
//             onMouseDown={handleMouseDown('end')}
//             onTouchStart={handleTouchStart('end')}
//           >
//             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
//               {end}
//             </div>
//           </div>
//         </div>

//         {/* 選択範囲の表示 */}
//         <div className="mt-3 text-center text-sm text-gray-600">
//           選択範囲：{start} ～ {end}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RangeSlider;
