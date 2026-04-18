'use client';

import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          className: cn(
            'rounded-[var(--radius-shell)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] shadow-[var(--shadow-panel)]',
            className,
          ),
          sx: {
            backgroundImage: 'none',
          },
        },
        backdrop: {
          sx: {
            backgroundColor: 'rgba(40,24,14,0.45)',
            backdropFilter: 'blur(2px)',
          },
        },
      }}
    >
      <DialogTitle sx={{ padding: 0 }}>
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <IconButton
            onClick={onClose}
            sx={{
              borderRadius: '999px',
              border: '1px solid var(--color-line)',
              color: 'var(--color-muted)',
              '&:hover': {
                backgroundColor: 'var(--color-brand-soft)',
                color: 'var(--color-brand-deep)',
              },
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent sx={{ padding: 0 }}>
        <div className="px-6 pb-6 pt-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
