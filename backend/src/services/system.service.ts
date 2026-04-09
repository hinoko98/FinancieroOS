export function getSystemInfo() {
  return {
    name: 'control-financiero-api',
    description:
      'Backend para control de entidades, ajustes de usuario y auditoria con Express, Prisma y PostgreSQL.',
    docs: '/docs',
    modules: ['auth', 'entities', 'settings', 'audit'],
  };
}
