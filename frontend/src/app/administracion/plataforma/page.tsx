import { AppShell } from '@/components/layout/app-shell';
import { SettingsWorkspace } from '@/features/settings/components/settings-workspace';

export default function AdministrationPlatformPage() {
  return (
    <AppShell>
      <SettingsWorkspace />
    </AppShell>
  );
}
