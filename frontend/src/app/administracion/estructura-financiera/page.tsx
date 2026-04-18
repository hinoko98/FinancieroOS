import { AppShell } from '@/components/layout/app-shell';
import { AdminFinanceStructureWorkspace } from '@/features/admin/components/admin-finance-structure-workspace';

export default function AdministrationFinanceStructurePage() {
  return (
    <AppShell>
      <AdminFinanceStructureWorkspace />
    </AppShell>
  );
}
