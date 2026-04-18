export function createOpenApiDocument() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Control Financiero API',
      description:
        'API Express para control financiero, autenticacion, entidades, ajustes y auditoria.',
      version: '1.0.0',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/': { get: { summary: 'Informacion general del sistema' } },
      '/health': { get: { summary: 'Healthcheck del servicio' } },
      '/admin/users': {
        get: {
          summary: 'Listar usuarios para administracion',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/finance-structure': {
        get: {
          summary: 'Consultar periodos y catalogo financiero administrativo',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/financial-periods': {
        post: {
          summary: 'Crear un periodo financiero mensual',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/financial-categories': {
        post: {
          summary: 'Crear una categoria financiera',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/financial-subcategories': {
        post: {
          summary: 'Crear una subcategoria financiera',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/overview': {
        get: {
          summary: 'Resumen administrativo del sistema',
          security: [{ bearerAuth: [] }],
        },
      },
      '/admin/users/{userId}': {
        patch: {
          summary: 'Actualizar un usuario desde administracion',
          security: [{ bearerAuth: [] }],
        },
      },
      '/auth/register': { post: { summary: 'Registro de usuario' } },
      '/auth/login': { post: { summary: 'Inicio de sesion' } },
      '/auth/verify-email': {
        get: { summary: 'Verificar correo electronico' },
      },
      '/auth/resend-verification': {
        post: {
          summary: 'Reenviar validacion de correo electronico',
          security: [{ bearerAuth: [] }],
        },
      },
      '/auth/me': {
        get: {
          summary: 'Perfil autenticado',
          security: [{ bearerAuth: [] }],
        },
      },
      '/auth/change-password': {
        patch: {
          summary: 'Cambio de contrasena',
          security: [{ bearerAuth: [] }],
        },
      },
      '/auth/profile': {
        patch: {
          summary: 'Actualizar perfil',
          security: [{ bearerAuth: [] }],
        },
      },
      '/entities': {
        get: {
          summary: 'Listar entidades del usuario',
          security: [{ bearerAuth: [] }],
        },
        post: { summary: 'Crear entidad', security: [{ bearerAuth: [] }] },
      },
      '/entities/{entityId}/items': {
        post: {
          summary: 'Crear item en una entidad',
          security: [{ bearerAuth: [] }],
        },
      },
      '/entities/items/{itemId}/records': {
        post: {
          summary: 'Crear registro sobre un item',
          security: [{ bearerAuth: [] }],
        },
      },
      '/finance/catalog': {
        get: {
          summary: 'Consultar catalogo financiero disponible',
          security: [{ bearerAuth: [] }],
        },
      },
      '/settings': {
        get: {
          summary: 'Obtener ajustes del usuario',
          security: [{ bearerAuth: [] }],
        },
        patch: {
          summary: 'Actualizar ajustes del usuario',
          security: [{ bearerAuth: [] }],
        },
      },
      '/settings/platform': {
        get: {
          summary: 'Consultar configuracion global de plataforma',
          security: [{ bearerAuth: [] }],
        },
        patch: {
          summary: 'Actualizar configuracion global de plataforma',
          security: [{ bearerAuth: [] }],
        },
      },
      '/settings/platform/banks': {
        post: {
          summary: 'Agregar un banco o billetera al catalogo global',
          security: [{ bearerAuth: [] }],
        },
      },
      '/settings/login-history': {
        get: {
          summary: 'Historial de accesos',
          security: [{ bearerAuth: [] }],
        },
      },
      '/audit/logs': {
        get: {
          summary: 'Consulta de auditoria',
          security: [{ bearerAuth: [] }],
        },
      },
    },
  };
}
