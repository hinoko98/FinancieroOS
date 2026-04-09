'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Share2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useSettings } from '@/lib/settings/settings-provider';
import { UserIcon } from '@/lib/settings/user-icons';
import { cn } from '@/lib/utils/cn';
import { ENTITIES_QUERY_KEY, type Entity } from '@/features/entities/lib/entities';

type PlatformSettings = {
  id: string;
  platformName: string;
  platformLabel: string;
  platformMotto: string;
  timezone: string;
  currencyCode: string;
  supportEmail: string | null;
};

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/entidades', label: 'Entidades', icon: Building2 },
  { href: '/compartidos', label: 'Compartidos', icon: Share2 },
  { href: '/registro-general', label: 'Registro general', icon: ClipboardList },
  { href: '/configuracion', label: 'Configuracion', icon: SlidersHorizontal },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/entidades/')) {
    return 'Detalle de entidad';
  }

  if (pathname === '/entidades') {
    return 'Entidades';
  }

  if (pathname === '/registro-general') {
    return 'Registro general';
  }

  if (pathname === '/compartidos') {
    return 'Compartidos';
  }

  if (pathname === '/configuracion') {
    return 'Configuracion';
  }

  if (pathname === '/mi-perfil') {
    return 'Mi perfil';
  }

  if (pathname === '/ajustes') {
    return 'Ajustes de plataforma';
  }

  return 'Dashboard';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const platformSettingsQuery = useQuery({
    queryKey: ['platform-settings-shell'],
    queryFn: async () => {
      const response = await apiClient.get<PlatformSettings>('/settings/platform');
      return response.data;
    },
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, router, user]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const syncSidebarState = (event?: MediaQueryListEvent) => {
      setSidebarOpen(event ? event.matches : mediaQuery.matches);
    };

    syncSidebarState();
    mediaQuery.addEventListener('change', syncSidebarState);

    return () => {
      mediaQuery.removeEventListener('change', syncSidebarState);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const shouldLockScroll =
      sidebarOpen && !window.matchMedia('(min-width: 1280px)').matches;

    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const authDisplayName = useMemo(() => user?.fullName ?? '', [user?.fullName]);

  if (!hydrated || !user) {
    return null;
  }

  const platformLabel = platformSettingsQuery.data?.platformLabel ?? 'Finance OS';
  const platformName = platformSettingsQuery.data?.platformName ?? 'Control Financiero';
  const platformMotto =
    platformSettingsQuery.data?.platformMotto ??
    'Entidades, servicios y pagos organizados';

  const closeSidebarOnMobile = () => {
    if (
      typeof window !== 'undefined' &&
      !window.matchMedia('(min-width: 1280px)').matches
    ) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'grid min-h-screen w-full gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 xl:gap-6 xl:px-6 xl:py-5 2xl:px-8',
        sidebarOpen
          ? 'xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]'
          : 'xl:grid-cols-[minmax(0,1fr)]',
      )}
    >
      <div
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'fixed inset-0 z-30 bg-[rgba(33,20,13,0.34)] backdrop-blur-[2px] transition xl:hidden',
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="app-shell-sidebar"
        className={cn(
          'fixed inset-y-3 left-3 z-40 flex w-[min(21rem,calc(100vw-1.5rem))] flex-col rounded-[var(--radius-shell)] border border-[var(--color-line)] bg-[linear-gradient(180deg,var(--color-brand),var(--color-brand-deep))] p-5 text-[#fff8f1] shadow-[var(--shadow-panel)] transition-all duration-300 sm:p-6 xl:sticky xl:top-5 xl:left-auto xl:z-auto xl:w-auto xl:self-start xl:overflow-y-auto 2xl:top-6',
          sidebarOpen
            ? 'translate-x-0 opacity-100 xl:h-[calc(100vh-2.5rem)] 2xl:h-[calc(100vh-3rem)]'
            : '-translate-x-[calc(100%+1rem)] opacity-0 pointer-events-none xl:hidden',
        )}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-[#f3dcc6]/80">
              {platformLabel}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{platformName}</h2>
            <p className="mt-2 text-sm text-[#f8e8d7]/70">{platformMotto}</p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 text-[#fff8f1] transition hover:bg-white/10 xl:hidden"
            aria-label="Cerrar menu principal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === '/entidades'
                ? pathname.startsWith('/entidades')
                : pathname === link.href;

            return (
              <div key={link.href} className="space-y-2">
                <Link
                  href={link.href}
                  onClick={closeSidebarOnMobile}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                      : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{link.label}</span>
                </Link>

                {link.href === '/entidades' && entitiesQuery.data?.length ? (
                  <div className="space-y-1 pl-3">
                    {entitiesQuery.data.map((entity) => {
                      const entityActive = pathname === `/entidades/${entity.id}`;

                      return (
                        <Link
                          key={entity.id}
                          href={`/entidades/${entity.id}`}
                          onClick={closeSidebarOnMobile}
                          className={cn(
                            'flex items-center gap-3 rounded-[calc(var(--radius-control)-4px)] px-3 py-2 text-sm transition',
                            entityActive
                              ? 'bg-white/12 text-white'
                              : 'text-[#f8e8d7]/76 hover:bg-white/8 hover:text-white',
                          )}
                        >
                          <span className="truncate">{entity.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 rounded-[var(--radius-shell)] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-panel)] backdrop-blur sm:p-6 xl:min-h-[calc(100vh-2.5rem)] xl:p-8 2xl:min-h-[calc(100vh-3rem)]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--color-line)] pb-5 sm:flex-row sm:items-center sm:justify-between xl:mb-8 xl:pb-6">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              aria-expanded={sidebarOpen}
              aria-controls="app-shell-sidebar"
              aria-label={sidebarOpen ? 'Ocultar menu principal' : 'Mostrar menu principal'}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
                Panel activo
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {getPageTitle(pathname)}
              </h1>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              className="flex items-center gap-3 rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-2 transition hover:border-[var(--color-brand)]"
            >
              <div className="rounded-full bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                <UserIcon iconId={settings?.userIcon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold">{authDisplayName}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  @{user.username}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
            </button>

            {profileMenuOpen ? (
              <div className="absolute right-0 z-20 mt-3 w-64 rounded-[var(--radius-popover)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-2 shadow-[var(--shadow-panel)]">
                <Link
                  href="/mi-perfil"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center rounded-[var(--radius-control)] px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]"
                >
                  Mi perfil
                </Link>
                <Link
                  href="/ajustes"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]"
                >
                  Ajustes de plataforma
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-danger)] transition hover:bg-[#f7e1dc]"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
