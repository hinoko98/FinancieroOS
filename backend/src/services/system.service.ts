export function getSystemInfo() {
  return {
    name: 'control-financiero-api',
    description:
      'Backend para control financiero, ajustes de usuario, auditoria y evolucion del dominio hacia FinancieroOS para Colombia.',
    docs: '/docs',
    modules: ['auth', 'entities', 'settings', 'audit', 'product-blueprint'],
  };
}
