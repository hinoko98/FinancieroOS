'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
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

type AuditLogEntry = {
  id: string;
  entityName: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'ACTIVATE' | 'DEACTIVATE' | 'LOGIN';
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  performedById: string | null;
  createdAt: string;
  performedBy: {
    id: string;
    username: string;
    fullName: string;
    role: string;
  } | null;
};

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

function readStringFromPayload(
  payload: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = payload?.[key];
  return typeof value === 'string' ? value : null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const { settings } = useSettings();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [ownedEntitiesOpen, setOwnedEntitiesOpen] = useState(true);
  const [sharedEntitiesOpen, setSharedEntitiesOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs-shell'],
    queryFn: async () => {
      const response = await apiClient.get<AuditLogEntry[]>('/audit/logs');
      return response.data;
    },
    enabled: Boolean(user),
    staleTime: 30_000,
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
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const shouldLockScroll =
      mobileSidebarOpen && !window.matchMedia('(min-width: 1280px)').matches;

    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const authDisplayName = useMemo(() => user?.fullName ?? '', [user?.fullName]);

  const createdAtFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Bogota',
      }),
    [],
  );

  const ownedEntities = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => entity.isOwner),
    [entitiesQuery.data],
  );

  const sharedEntities = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => !entity.isOwner),
    [entitiesQuery.data],
  );

  const currentEntity = useMemo(() => {
    if (!pathname.startsWith('/entidades/')) {
      return null;
    }

    return (
      entitiesQuery.data?.find(
        (entity) => pathname === `/entidades/${entity.id}`,
      ) ?? null
    );
  }, [entitiesQuery.data, pathname]);

  const unpaidItems = useMemo(
    () =>
      (entitiesQuery.data ?? [])
        .flatMap((entity) =>
          entity.items
            .filter((item) => item.recordsCount === 0)
            .map((item) => ({
              id: `${entity.id}-${item.id}`,
              entityId: entity.id,
              entityName: entity.name,
              itemName: item.name,
              paymentReference: item.paymentReference,
              createdAt: item.createdAt,
              accessLabel: entity.isOwner ? 'Propia' : 'Compartida',
            })),
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 6),
    [entitiesQuery.data],
  );

  const relevantAuditLogs = useMemo(() => {
    const accessibleEntityIds = new Set(
      (entitiesQuery.data ?? []).map((entity) => entity.id),
    );

    return (auditLogsQuery.data ?? [])
      .filter((log) => {
        if (log.entityName === 'PlatformSetting' || log.entityName === 'UserSetting') {
          return true;
        }

        if (log.entityName === 'TrackingEntity') {
          return (
            accessibleEntityIds.has(log.entityId) || log.performedById === user?.id
          );
        }

        if (log.entityName === 'TrackingEntityShare') {
          const relatedEntityId =
            readStringFromPayload(log.after, 'entityId') ??
            readStringFromPayload(log.before, 'entityId');
          const affectsCurrentUser =
            readStringFromPayload(log.after, 'username') === user?.username ||
            readStringFromPayload(log.before, 'username') === user?.username;

          return (
            affectsCurrentUser ||
            log.performedById === user?.id ||
            (relatedEntityId ? accessibleEntityIds.has(relatedEntityId) : false)
          );
        }

        return log.performedById === user?.id;
      })
      .slice(0, 8);
  }, [auditLogsQuery.data, entitiesQuery.data, user?.id, user?.username]);

  const notificationCount = unpaidItems.length + relevantAuditLogs.length;

  const entitiesLinkActive =
    pathname === '/entidades' ||
    (pathname.startsWith('/entidades/') && (currentEntity?.isOwner ?? true));

  const sharedLinkActive =
    pathname === '/compartidos' ||
    (pathname.startsWith('/entidades/') && currentEntity?.isOwner === false);

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
      setMobileSidebarOpen(false);
    }

    setNotificationsOpen(false);
    setProfileMenuOpen(false);
  };

  const toggleSidebar = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1280px)').matches
    ) {
      setSidebarExpanded((current) => !current);
      return;
    }

    setMobileSidebarOpen((current) => !current);
  };

  return (
    <div
      className={cn(
        'grid min-h-screen w-full gap-4 bg-[var(--color-surface)] px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 xl:gap-0 xl:px-0 xl:py-0',
        sidebarExpanded
          ? 'xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]'
          : 'xl:grid-cols-[94px_minmax(0,1fr)]',
      )}
    >
      <div
        aria-hidden="true"
        onClick={() => setMobileSidebarOpen(false)}
        className={cn(
          'fixed inset-0 z-30 bg-[rgba(33,20,13,0.34)] backdrop-blur-[2px] transition xl:hidden',
          mobileSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="app-shell-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[min(22rem,100vw)] flex-col bg-[linear-gradient(180deg,var(--color-brand),var(--color-brand-deep))] p-5 text-[#fff8f1] transition-all duration-300 sm:p-6 xl:sticky xl:top-0 xl:left-auto xl:z-auto xl:w-full xl:self-stretch xl:translate-x-0 xl:opacity-100 xl:pointer-events-auto',
          mobileSidebarOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-[calc(100%+1rem)] opacity-0 pointer-events-none',
          sidebarExpanded
            ? 'xl:h-screen xl:px-8 xl:py-8'
            : 'xl:h-screen xl:px-3 xl:py-8',
        )}
      >
        <div
          className={cn(
            'mb-10 flex items-start justify-between gap-4',
            !sidebarExpanded && 'xl:mb-6 xl:flex-col xl:items-center xl:gap-3',
          )}
        >
          <div className={cn(!sidebarExpanded && 'xl:text-center')}>
            <p
              className={cn(
                'text-xs uppercase tracking-[0.34em] text-[#f3dcc6]/80',
                !sidebarExpanded && 'xl:hidden',
              )}
            >
              {platformLabel}
            </p>
            <div
              className={cn(
                'mt-4',
                !sidebarExpanded && 'xl:mt-0 xl:flex xl:justify-center',
              )}
            >
              <div className="text-center">
                <p
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    !sidebarExpanded && 'xl:hidden',
                  )}
                >
                  {platformName}
                </p>
                <p
                  className={cn(
                    'hidden text-lg font-bold tracking-[0.18em] xl:block',
                    sidebarExpanded && 'xl:hidden',
                  )}
                >
                  FOS
                </p>
              </div>
            </div>
            <p
              className={cn(
                'mt-2 text-sm text-[#f8e8d7]/70',
                !sidebarExpanded && 'xl:hidden',
              )}
            >
              {platformMotto}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-[#fff8f1] transition hover:bg-white/10 xl:hidden"
            aria-label="Cerrar menu principal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className={cn(
            'flex flex-1 flex-col gap-2 overflow-y-auto',
            !sidebarExpanded && 'xl:items-center xl:overflow-visible',
          )}
        >
          <Link
            href="/"
            onClick={closeSidebarOnMobile}
            title={!sidebarExpanded ? 'Dashboard' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
              !sidebarExpanded && 'xl:w-14 xl:justify-center xl:px-0',
              pathname === '/'
                ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className={cn('flex-1', !sidebarExpanded && 'xl:hidden')}>
              Dashboard
            </span>
          </Link>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href="/entidades"
                onClick={closeSidebarOnMobile}
                title={!sidebarExpanded ? 'Entidades' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
                  !sidebarExpanded && 'xl:w-14 xl:justify-center xl:px-0',
                  entitiesLinkActive
                    ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                    : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span className={cn('flex-1', !sidebarExpanded && 'xl:hidden')}>
                  Entidades
                </span>
              </Link>

              {sidebarExpanded ? (
                <button
                  type="button"
                  onClick={() => setOwnedEntitiesOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-[#f7ede1] transition hover:bg-white/10"
                  aria-label={
                    ownedEntitiesOpen
                      ? 'Ocultar entidades propias'
                      : 'Mostrar entidades propias'
                  }
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      ownedEntitiesOpen ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
              ) : null}
            </div>

            {sidebarExpanded && ownedEntitiesOpen ? (
              ownedEntities.length ? (
                <div className="space-y-1 pl-3">
                  {ownedEntities.map((entity) => {
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
              ) : (
                <div className="pl-3 text-sm text-[#f8e8d7]/70">
                  No hay entidades propias.
                </div>
              )
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href="/compartidos"
                onClick={closeSidebarOnMobile}
                title={!sidebarExpanded ? 'Compartidos' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
                  !sidebarExpanded && 'xl:w-14 xl:justify-center xl:px-0',
                  sharedLinkActive
                    ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                    : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
                )}
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span className={cn('flex-1', !sidebarExpanded && 'xl:hidden')}>
                  Compartidos
                </span>
              </Link>

              {sidebarExpanded ? (
                <button
                  type="button"
                  onClick={() => setSharedEntitiesOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-[#f7ede1] transition hover:bg-white/10"
                  aria-label={
                    sharedEntitiesOpen
                      ? 'Ocultar entidades compartidas'
                      : 'Mostrar entidades compartidas'
                  }
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      sharedEntitiesOpen ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
              ) : null}
            </div>

            {sidebarExpanded && sharedEntitiesOpen ? (
              sharedEntities.length ? (
                <div className="space-y-1 pl-3">
                  {sharedEntities.map((entity) => {
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
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-60" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="pl-3 text-sm text-[#f8e8d7]/70">
                  No hay entidades compartidas.
                </div>
              )
            ) : null}
          </div>

          <Link
            href="/registro-general"
            onClick={closeSidebarOnMobile}
            title={!sidebarExpanded ? 'Registro general' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
              !sidebarExpanded && 'xl:w-14 xl:justify-center xl:px-0',
              pathname === '/registro-general'
                ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
            )}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className={cn('flex-1', !sidebarExpanded && 'xl:hidden')}>
              Registro general
            </span>
          </Link>

          <Link
            href="/configuracion"
            onClick={closeSidebarOnMobile}
            title={!sidebarExpanded ? 'Configuracion' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold transition',
              !sidebarExpanded && 'xl:w-14 xl:justify-center xl:px-0',
              pathname === '/configuracion'
                ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] shadow-sm'
                : 'text-[#f7ede1] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand-deep)]',
            )}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className={cn('flex-1', !sidebarExpanded && 'xl:hidden')}>
              Configuracion
            </span>
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 rounded-[var(--radius-shell)] bg-[var(--color-panel)] p-4 sm:p-6 xl:min-h-screen xl:rounded-none xl:px-10 xl:py-8 2xl:px-12">
        <header className="mb-6 flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between xl:mb-8 xl:pb-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={sidebarExpanded || mobileSidebarOpen}
              aria-controls="app-shell-sidebar"
              aria-label={
                sidebarExpanded || mobileSidebarOpen
                  ? 'Ocultar menu principal'
                  : 'Mostrar menu principal'
              }
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
            >
              {sidebarExpanded || mobileSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
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

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setProfileMenuOpen(false);
                }}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                aria-label="Mostrar notificaciones"
              >
                <Bell className="h-5 w-5" />
                {notificationCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 z-20 mt-3 w-[min(26rem,calc(100vw-2rem))] rounded-[var(--radius-popover)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-3 shadow-[var(--shadow-panel)]">
                  <div className="border-b border-[var(--color-line)]/30 px-2 pb-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      Notificaciones
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Ajustes, compartidos y recibos sin pago registrado.
                    </p>
                  </div>

                  <div className="max-h-[28rem] space-y-4 overflow-y-auto px-2 py-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Recibos pendientes</p>
                      {unpaidItems.length ? (
                        unpaidItems.map((item) => (
                          <Link
                            key={item.id}
                            href={`/entidades/${item.entityId}`}
                            onClick={() => setNotificationsOpen(false)}
                            className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 transition hover:border-[var(--color-brand)]"
                          >
                            <div className="rounded-[var(--radius-control)] bg-[#f7e8bf] p-2 text-[#8b5e17]">
                              <ReceiptText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold">{item.itemName}</p>
                              <p className="text-sm text-[var(--color-muted)]">
                                {item.entityName}
                                {item.paymentReference
                                  ? ` / Ref ${item.paymentReference}`
                                  : ''}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#8b5e17]">
                                {item.accessLabel} / Sin pago registrado
                              </p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
                          No hay recibos pendientes sin pago registrado.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Actividad reciente</p>
                      {relevantAuditLogs.length ? (
                        relevantAuditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3"
                          >
                            <p className="font-semibold">{log.summary}</p>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {log.performedBy?.fullName ?? 'Sistema'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                              {createdAtFormatter.format(new Date(log.createdAt))}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
                          No hay actividad reciente para mostrar.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-2 transition hover:border-[var(--color-brand)]"
              >
                <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
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
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
