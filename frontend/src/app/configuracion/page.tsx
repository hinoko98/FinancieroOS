import { AppShell } from '@/components/layout/app-shell';
import { AppearanceWorkspace } from '@/features/settings/components/appearance-workspace';

export default function ConfigurationPage() {
  return (
    <AppShell>
      <AppearanceWorkspace />
    </AppShell>
  );
}
