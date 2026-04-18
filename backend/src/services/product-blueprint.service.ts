export function getProductBlueprint() {
  return {
    updatedAt: '2026-04-18',
    country: 'CO',
    product: {
      currentName: 'Control Financiero',
      targetName: 'FinancieroOS',
      firstStageName: 'MVP de organizacion financiera y acompanamiento tributario',
      recommendation: 'Refactorizacion progresiva con nuevo nucleo de dominio',
    },
    diagnostic: {
      summary:
        'El modelo actual resuelve acceso, auditoria y comparticion, pero sigue expresando un control financiero generico en lugar de un dominio personal colombiano.',
      points: [
        'TrackingEntity ya sirve como contenedor auditable y compartible.',
        'TrackingEntityItem mezcla conceptos, servicios y estructura de seguimiento.',
        'TrackingEntityRecord no separa con suficiente claridad ingresos, gastos y trazabilidad documental.',
        'TrackingEntityAllocation solo cubre una parte del nuevo negocio.',
        'El dominio actual no distingue bien cliente persona natural, contador y asesor financiero.',
      ],
    },
    domainModel: {
      roles: [
        {
          id: 'PERSON_NATURAL',
          label: 'Persona natural',
          purpose:
            'Organiza su informacion financiera, soportes, relaciones y expediente anual.',
          permissions: [
            'Crear y administrar su expediente financiero',
            'Registrar ingresos y gastos por entidad',
            'Compartir expediente o entidades con profesionales',
            'Cargar soportes documentales',
          ],
        },
        {
          id: 'ACCOUNTANT',
          label: 'Contador certificado',
          purpose:
            'Revisa soportes, seguimiento tributario y preparacion documental del cliente.',
          permissions: [
            'Consultar expedientes asignados',
            'Agregar observaciones y seguimiento',
            'Solicitar soportes faltantes',
            'Actualizar estado del caso tributario si tiene permisos',
          ],
        },
        {
          id: 'FINANCIAL_ADVISOR',
          label: 'Asesor financiero',
          purpose:
            'Acompana organizacion financiera, planeacion y seguimiento operativo.',
          permissions: [
            'Consultar o editar entidades autorizadas',
            'Agregar observaciones y tareas',
            'Acompanar orden financiero del cliente',
          ],
        },
        {
          id: 'PLATFORM_ADMIN',
          label: 'Administrador de plataforma',
          purpose:
            'Administra configuracion global, verificacion profesional y gobierno operativo.',
          permissions: [
            'Administrar catalogos y configuracion global',
            'Verificar perfiles profesionales',
            'Monitorear auditoria y actividad',
          ],
        },
      ],
      boundedContexts: [
        {
          name: 'Perfiles y relaciones',
          includes: [
            'ClientProfile',
            'ProfessionalProfile',
            'ClientProfessionalLink',
          ],
        },
        {
          name: 'Expediente financiero',
          includes: ['FinancialDossier', 'FinancialEntity', 'EntityNote'],
        },
        {
          name: 'Movimientos y soportes',
          includes: ['FinancialMovement', 'DocumentSupport'],
        },
        {
          name: 'Acompanamiento tributario',
          includes: ['TaxCase', 'TaxCaseTimeline'],
        },
      ],
      entityDecisions: [
        {
          currentModel: 'TrackingEntity',
          action: 'ADAPT',
          proposedModel: 'FinancialEntity',
          reason:
            'Debe permanecer como unidad de organizacion separada, pero enfocada a control financiero por expediente.',
        },
        {
          currentModel: 'TrackingEntityItem',
          action: 'REPLACE',
          proposedModel: 'FinancialConcept / categorias / notas / documentos',
          reason:
            'Hoy concentra demasiadas responsabilidades y no escala bien al nuevo producto.',
        },
        {
          currentModel: 'TrackingEntityRecord',
          action: 'REPLACE',
          proposedModel: 'FinancialMovement',
          reason:
            'El nuevo producto necesita ingresos y gastos explicitos como concepto central.',
        },
        {
          currentModel: 'TrackingEntityAllocation',
          action: 'ADAPT',
          proposedModel: 'FinancialTransfer',
          reason:
            'Solo debe sobrevivir para movimientos internos o transferencias puntuales.',
        },
        {
          currentModel: 'TrackingEntityShare',
          action: 'ADAPT',
          proposedModel: 'FinancialEntityAccess',
          reason:
            'La comparticion sigue siendo valiosa, pero debe entender relaciones profesionales.',
        },
      ],
      transformationFlow: [
        {
          from: 'Usuario generico',
          to: 'Cliente o profesional con perfil de negocio',
          details: [
            'El usuario sigue siendo la identidad tecnica.',
            'Los perfiles agregan semantica del negocio sin romper auth.',
          ],
        },
        {
          from: 'Entidad generica',
          to: 'Entidad financiera dentro de expediente anual',
          details: [
            'Cada entidad maneja ingresos, gastos, soportes y observaciones por separado.',
            'La entidad deja de depender del concepto de servicio como eje principal.',
          ],
        },
        {
          from: 'Registro generico',
          to: 'Movimiento financiero',
          details: [
            'Se explicita ingreso o gasto.',
            'Se asocia categoria, fecha, monto y soporte.',
          ],
        },
      ],
    },
    mvp: {
      modules: [
        {
          id: 'profiles',
          name: 'Perfiles y roles de negocio',
          scope:
            'Persona natural, contador, asesor y validacion profesional inicial.',
        },
        {
          id: 'dossiers',
          name: 'Expediente financiero anual',
          scope:
            'Creacion y seguimiento del expediente por ano gravable del cliente.',
        },
        {
          id: 'financial-entities',
          name: 'Entidades financieras',
          scope:
            'Organizacion separada de movimientos, soportes y observaciones.',
        },
        {
          id: 'movements',
          name: 'Ingresos y gastos',
          scope:
            'Registro estructurado de movimientos financieros por entidad.',
        },
        {
          id: 'documents',
          name: 'Soportes documentales',
          scope:
            'Vinculacion de evidencias al expediente, entidad o movimiento.',
        },
        {
          id: 'relationships',
          name: 'Relacion con contador y asesor',
          scope:
            'Invitacion, aceptacion, permisos y seguimiento colaborativo.',
        },
        {
          id: 'tax-cases',
          name: 'Caso tributario basico',
          scope:
            'Estado del caso, checklist manual y trazabilidad de revision.',
        },
      ],
      deferredCapabilities: [
        'Calculo automatico de declaracion de renta',
        'Integraciones con DIAN',
        'Marketplace abierto de contadores',
        'OCR o extraccion automatica avanzada',
      ],
    },
    databaseChanges: {
      keep: [
        'User',
        'AuditLog',
        'LoginHistory',
        'UserSetting',
        'PlatformSetting',
      ],
      adapt: ['TrackingEntity', 'TrackingEntityShare'],
      replace: [
        'TrackingEntityItem',
        'TrackingEntityRecord',
        'TrackingEntityAllocation',
      ],
      create: [
        'ClientProfile',
        'ProfessionalProfile',
        'ProfessionalCredential',
        'ClientProfessionalLink',
        'FinancialDossier',
        'FinancialEntity',
        'FinancialEntityAccess',
        'FinancialMovement',
        'DocumentSupport',
        'TaxCase',
      ],
    },
    backendChanges: {
      architecture: [
        'auth',
        'profiles',
        'relationships',
        'dossiers',
        'financial-entities',
        'movements',
        'documents',
        'tax-cases',
        'audit',
        'settings',
      ],
      initialRoutes: [
        { method: 'GET', path: '/api/v1/product-blueprint', summary: 'Contrato del rediseño del producto' },
        { method: 'GET', path: '/api/v1/profiles/me', summary: 'Consultar perfil de negocio actual' },
        { method: 'PATCH', path: '/api/v1/profiles/me/client', summary: 'Actualizar perfil de persona natural' },
        { method: 'PATCH', path: '/api/v1/profiles/me/professional', summary: 'Actualizar perfil profesional' },
        { method: 'GET', path: '/api/v1/dossiers', summary: 'Listar expedientes del cliente' },
        { method: 'POST', path: '/api/v1/dossiers', summary: 'Crear expediente financiero anual' },
        { method: 'POST', path: '/api/v1/dossiers/:dossierId/entities', summary: 'Crear entidad financiera en expediente' },
        { method: 'GET', path: '/api/v1/entities/:entityId/movements', summary: 'Listar movimientos de la entidad' },
        { method: 'POST', path: '/api/v1/entities/:entityId/movements', summary: 'Registrar ingreso o gasto' },
        { method: 'GET', path: '/api/v1/relationships', summary: 'Listar relaciones cliente-profesional' },
        { method: 'POST', path: '/api/v1/relationships/invitations', summary: 'Invitar profesional o cliente' },
        { method: 'GET', path: '/api/v1/tax-cases/:dossierId', summary: 'Consultar caso tributario del expediente' },
      ],
    },
    frontendChanges: {
      routes: [
        '/administracion/rediseno-mvp',
        '/expedientes',
        '/expedientes/:dossierId',
        '/expedientes/:dossierId/entidades/:entityId',
        '/relaciones',
        '/casos-tributarios/:dossierId',
      ],
      screens: [
        'Panel administrativo del rediseño',
        'Dashboard de expedientes',
        'Detalle de expediente anual',
        'Detalle de entidad financiera',
        'Relacion con contador y asesor',
        'Caso tributario basico',
      ],
      decisions: [
        'Mantener React Router y React Query como base.',
        'Migrar la navegacion principal en fases sin romper la app actual.',
        'Usar el blueprint como referencia viva del producto.',
      ],
    },
    implementationOrder: [
      'Versionar el blueprint funcional y tecnico',
      'Crear perfiles de negocio y relaciones',
      'Crear expediente financiero anual',
      'Crear nueva entidad financiera',
      'Crear movimientos de ingresos y gastos',
      'Agregar soportes documentales',
      'Agregar caso tributario basico',
      'Migrar gradualmente la experiencia principal',
    ],
    risks: {
      keepingTooMuchOfCurrentModel: [
        'Seguir creciendo sobre semantica generica.',
        'Multiplicar deuda conceptual en sharing, records y items.',
        'Dificultar la futura capa tributaria.',
      ],
      redesigningEverythingAtOnce: [
        'Riesgo alto de regresiones.',
        'Tiempo de entrega mayor al MVP necesario.',
        'Perdida de componentes y flujos que ya funcionan.',
      ],
      recommendation:
        'Crear un nuevo nucleo de dominio y migrar progresivamente, no reescribir todo ni seguir parchando el modelo antiguo.',
    },
  };
}
