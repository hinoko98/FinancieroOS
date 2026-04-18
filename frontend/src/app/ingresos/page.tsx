import { AppShell } from '@/components/layout/app-shell';
import { IncomesWorkspace } from '@/features/incomes/components/incomes-workspace';

export default function IncomesPage() {
  return (
    <AppShell>
      <IncomesWorkspace />
    </AppShell>
  );
}
