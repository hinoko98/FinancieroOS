import { AppShell } from '@/components/layout/app-shell';
import { EntitiesWorkspace } from '@/features/entities/components/entities-workspace';

export default function EntitiesPage() {
  return (
    <AppShell>
      <EntitiesWorkspace />
    </AppShell>
  );
}
