import type { DashboardModule } from '@/types/dashboard';

export const dashboardModules: DashboardModule[] = [
  {
    title: 'Entidades',
    href: '/entidades',
    description: 'Control principal',
    emphasis: 'Entidades',
  },
  {
    title: 'Registro general',
    href: '/registro-general',
    description: 'Gastos',
    emphasis: 'Registro general',
  },
  {
    title: 'Compartidos',
    href: '/compartidos',
    description: 'Permisos',
    emphasis: 'Compartidos',
  },
  {
    title: 'Configuracion',
    href: '/configuracion',
    description: 'Apariencia',
    emphasis: 'Configuracion',
  },
  {
    title: 'Plataforma',
    href: '/ajustes',
    description: 'Configuracion global',
    emphasis: 'Plataforma',
  },
];
