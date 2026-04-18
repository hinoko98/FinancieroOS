import { AppShell } from '@/components/layout/app-shell';
import { AdminUsersWorkspace } from '@/features/admin/components/admin-users-workspace';

export default function AdministrationUsersPage() {
  return (
    <AppShell>
      <AdminUsersWorkspace />
    </AppShell>
  );
}
