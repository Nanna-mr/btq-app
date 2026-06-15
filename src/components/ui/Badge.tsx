import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'green' | 'amber' | 'red' | 'slate';
  children: ReactNode;
}

const tones = {
  green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  slate: 'bg-slate-100 text-slate-700',
};

export function Badge({ tone = 'slate', children }: BadgeProps) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
