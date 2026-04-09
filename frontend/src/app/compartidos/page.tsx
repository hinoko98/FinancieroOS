import { AppShell } from '@/components/layout/app-shell';
import { SharedEntitiesWorkspace } from '@/features/entities/components/shared-entities-workspace';

export default function SharedEntitiesPage() {
  return (
    <AppShell>
      <SharedEntitiesWorkspace />
    </AppShell>
  );
}
