import { AppShell } from '@/components/layout/app-shell';
import { EntityDetailWorkspace } from '@/features/entities/components/entity-detail-workspace';

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;

  return (
    <AppShell>
      <EntityDetailWorkspace entityId={entityId} />
    </AppShell>
  );
}
