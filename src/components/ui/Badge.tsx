import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'green' | 'amber' | 'red' | 'slate';
  children: ReactNode;
}

const tones = {
  green: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  amber: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  red: 'bg-red-100 text-red-800 ring-1 ring-red-300',
  slate: 'bg-slate-100 text-slate-800 ring-1 ring-slate-300',
};

export function Badge({ tone = 'slate', children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded px-3 py-1.5 text-xs font-black uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}
