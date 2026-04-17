import { AuthProvider } from '@/lib/auth/auth-provider';
import { MuiProvider } from '@/lib/mui/mui-provider';
import { QueryProvider } from '@/lib/query/query-provider';
import { SettingsProvider } from '@/lib/settings/settings-provider';
import './globals.css';

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MuiProvider>
      <QueryProvider>
        <AuthProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </AuthProvider>
      </QueryProvider>
    </MuiProvider>
  );
}
