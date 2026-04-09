import { AppShell } from '@/components/layout/app-shell';
import { GeneralRecordsWorkspace } from '@/features/records/components/general-records-workspace';

export default function GeneralRecordsPage() {
  return (
    <AppShell>
      <GeneralRecordsWorkspace />
    </AppShell>
  );
}
