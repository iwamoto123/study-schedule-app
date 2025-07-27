///app/components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenIcon,         // materials
  PencilSquareIcon,     // progress
  ChartBarIcon,         // graph
} from '@heroicons/react/24/outline';

const tabs = [
  { href: '/materials', label: '参考書',   icon: BookOpenIcon },
  { href: '/progress',  label: '進捗入力', icon: PencilSquareIcon },
  { href: '/graph',     label: 'グラフ',   icon: ChartBarIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white shadow-sm">
      {/* ------ 追加: PC では幅を制限して中央寄せ ------ */}
      <div className="mx-auto w-full max-w-2xl">
        <ul className="grid grid-cols-3">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex flex-col items-center gap-0.5 py-2 text-xs"
                >
                  <Icon
                    className={`h-6 w-6 ${
                      active ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`${
                      active ? 'text-indigo-600 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* ------------------------------------------------ */}
    </nav>
  );
}
