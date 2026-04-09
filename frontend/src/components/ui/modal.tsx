'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function Modal({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(40,24,14,0.45)] p-4">
      <div
        className={cn(
          'w-full max-w-xl rounded-[var(--radius-shell)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-panel)]',
          className,
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--color-line)] p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
