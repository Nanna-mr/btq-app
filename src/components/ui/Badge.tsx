import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'green' | 'amber' | 'red' | 'slate';
  children: ReactNode;
}

const tones = {
  green: 'bg-[#245855]/10 text-[#245855] ring-1 ring-[#245855]/20',
  amber: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  red: 'bg-red-100 text-red-800 ring-1 ring-red-300',
  slate: 'bg-[#dedede] text-[#111111] ring-1 ring-[#989a9a]/40',
};

export function Badge({ tone = 'slate', children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded px-3 py-1.5 text-xs font-black uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}
