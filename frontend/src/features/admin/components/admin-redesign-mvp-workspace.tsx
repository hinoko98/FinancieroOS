'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, FileStack, ShieldCheck, UsersRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import {
  extractApiErrorMessage,
} from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  PRODUCT_BLUEPRINT_QUERY_KEY,
  type ProductBlueprint,
} from '../lib/product-blueprint';

function TagList({
  values,
  tone = 'brand',
}: {
  values: string[];
  tone?: 'brand' | 'danger' | 'warning';
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-[#f7e1dc] text-[var(--color-danger)]'
      : tone === 'warning'
        ? 'bg-[#f5e8c6] text-[#8c611b]'
        : 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]';

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${toneClass}`}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export function AdminRedesignMvpWorkspace() {
  const { user } = useAuth();

  const blueprintQuery = useQuery({
    queryKey: PRODUCT_BLUEPRINT_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ProductBlueprint>('/product-blueprint');
      return response.data;
    },
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <SectionCard
        title="Rediseño MVP"
        subtitle="Esta vista esta disponible solo para administradores."
      >
        <p className="text-sm text-[var(--color-muted)]">
          Tu usuario no tiene permisos para consultar el blueprint del rediseño.
        </p>
      </SectionCard>
    );
  }

  if (blueprintQuery.isLoading) {
    return (
      <SectionCard
        title="Rediseño MVP"
        subtitle="Cargando la propuesta de evolucion funcional y tecnica."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (blueprintQuery.isError || !blueprintQuery.data) {
    return (
      <SectionCard
        title="Rediseño MVP"
        subtitle="No fue posible cargar el blueprint del producto."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(blueprintQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => blueprintQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  const blueprint = blueprintQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rediseño MVP"
        description="Blueprint vivo del primer corte de FinancieroOS para Colombia: dominio, MVP, base de datos, API inicial y orden recomendado de implementacion."
      />

      <SectionCard
        title="Direccion del producto"
        subtitle={`Actualizado el ${blueprint.updatedAt} para ${blueprint.country}.`}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">Producto actual</p>
            <p className="mt-2 text-xl font-bold">{blueprint.product.currentName}</p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">Producto objetivo</p>
            <p className="mt-2 text-xl font-bold">{blueprint.product.targetName}</p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">Enfoque recomendado</p>
            <p className="mt-2 text-xl font-bold">{blueprint.product.recommendation}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Diagnostico del modelo actual"
        subtitle={blueprint.diagnostic.summary}
      >
        <div className="space-y-3">
          {blueprint.diagnostic.points.map((point) => (
            <div
              key={point}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]"
            >
              {point}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Propuesta del nuevo modelo de dominio"
        subtitle="Roles, contextos y transformacion del modelo actual al nuevo producto."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {blueprint.domainModel.roles.map((role) => (
            <div
              key={role.id}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand)]">
                {role.id}
              </p>
              <h3 className="mt-3 text-xl font-bold">{role.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {role.purpose}
              </p>
              <div className="mt-4 space-y-2">
                {role.permissions.map((permission) => (
                  <p key={permission} className="text-sm text-[var(--color-ink)]">
                    {permission}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <FileStack className="h-4 w-4 text-[var(--color-brand)]" />
                Contextos funcionales
              </p>
              <div className="mt-4 space-y-4">
                {blueprint.domainModel.boundedContexts.map((context) => (
                  <div key={context.name}>
                    <p className="font-semibold">{context.name}</p>
                    <div className="mt-2">
                      <TagList values={context.includes} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {blueprint.domainModel.entityDecisions.map((decision) => (
              <div
                key={decision.currentModel}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-deep)]">
                    {decision.action}
                  </span>
                  <p className="font-semibold">
                    {decision.currentModel} {'->'} {decision.proposedModel}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {decision.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="MVP inicial"
        subtitle="Capacidades minimas para validar organizacion financiera personal y colaboracion profesional."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {blueprint.mvp.modules.map((module) => (
            <div
              key={module.id}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
                {module.id}
              </p>
              <h3 className="mt-3 text-lg font-bold">{module.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {module.scope}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
          <p className="font-semibold">Fuera del MVP inicial</p>
          <div className="mt-4">
            <TagList values={blueprint.mvp.deferredCapabilities} tone="warning" />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Cambios en base de datos"
          subtitle="Que mantener, adaptar, reemplazar y crear."
        >
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="font-semibold">Mantener</p>
              <div className="mt-3">
                <TagList values={blueprint.databaseChanges.keep} />
              </div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="font-semibold">Adaptar</p>
              <div className="mt-3">
                <TagList values={blueprint.databaseChanges.adapt} tone="warning" />
              </div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="font-semibold">Reemplazar progresivamente</p>
              <div className="mt-3">
                <TagList values={blueprint.databaseChanges.replace} tone="danger" />
              </div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="font-semibold">Crear</p>
              <div className="mt-3">
                <TagList values={blueprint.databaseChanges.create} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Cambios en backend"
          subtitle="Arquitectura modular y rutas semilla del nuevo dominio."
        >
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
            <p className="font-semibold">Modulos recomendados</p>
            <div className="mt-3">
              <TagList values={blueprint.backendChanges.architecture} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {blueprint.backendChanges.initialRoutes.map((route) => (
              <div
                key={`${route.method}:${route.path}`}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3"
              >
                <p className="font-mono text-sm font-semibold">
                  {route.method} {route.path}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {route.summary}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Cambios en frontend"
        subtitle="Pantallas y decisiones iniciales para React."
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 font-semibold">
                <UsersRound className="h-4 w-4 text-[var(--color-brand)]" />
                Pantallas iniciales
              </p>
              <div className="mt-4 space-y-2">
                {blueprint.frontendChanges.screens.map((screen) => (
                  <p key={screen} className="text-sm text-[var(--color-ink)]">
                    {screen}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 font-semibold">
                <ArrowRightLeft className="h-4 w-4 text-[var(--color-brand)]" />
                Rutas previstas
              </p>
              <div className="mt-4 space-y-2">
                {blueprint.frontendChanges.routes.map((route) => (
                  <p key={route} className="font-mono text-sm text-[var(--color-ink)]">
                    {route}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-[var(--color-brand)]" />
                Decisiones de implementacion
              </p>
              <div className="mt-4 space-y-3">
                {blueprint.frontendChanges.decisions.map((decision) => (
                  <p key={decision} className="text-sm leading-6 text-[var(--color-muted)]">
                    {decision}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Orden de implementacion recomendado"
          subtitle="Secuencia sugerida para evolucionar sin romper lo actual."
        >
          <div className="space-y-3">
            {blueprint.implementationOrder.map((step, index) => (
              <div
                key={step}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm"
              >
                <span className="mr-3 font-semibold text-[var(--color-brand)]">
                  {index + 1}.
                </span>
                {step}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Riesgos y decisiones importantes"
          subtitle={blueprint.risks.recommendation}
        >
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="font-semibold">Riesgos si mantienes demasiado del modelo actual</p>
              <div className="mt-3 space-y-2">
                {blueprint.risks.keepingTooMuchOfCurrentModel.map((risk) => (
                  <p key={risk} className="text-sm text-[var(--color-ink)]">
                    {risk}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="font-semibold">Riesgos si redisenas todo de golpe</p>
              <div className="mt-3 space-y-2">
                {blueprint.risks.redesigningEverythingAtOnce.map((risk) => (
                  <p key={risk} className="text-sm text-[var(--color-ink)]">
                    {risk}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
