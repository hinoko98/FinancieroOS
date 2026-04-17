import { AppShell } from '@/components/layout/app-shell';
import { AdminOverviewWorkspace } from '@/features/admin/components/admin-overview-workspace';

export default function AdministrationPage() {
  return (
    <AppShell>
      <AdminOverviewWorkspace />
    </AppShell>
  );
}
