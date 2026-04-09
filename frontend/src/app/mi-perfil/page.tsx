import { AppShell } from '@/components/layout/app-shell';
import { ProfileWorkspace } from '@/features/profile/components/profile-workspace';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileWorkspace />
    </AppShell>
  );
}
