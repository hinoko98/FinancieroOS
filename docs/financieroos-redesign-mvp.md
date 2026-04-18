# Diagnóstico del modelo actual

## Hallazgos principales

- El sistema actual resuelve bien autenticación, auditoría, control de acceso y trazabilidad.
- El núcleo del dominio gira alrededor de `TrackingEntity`, `TrackingEntityItem`, `TrackingEntityRecord` y `TrackingEntityAllocation`.
- Ese núcleo sirve para control operativo genérico, pero no representa todavía un caso financiero personal colombiano.
- El concepto de "entidad" sí es reutilizable, pero hoy está demasiado acoplado a servicios, pagos y asignaciones.
- La plataforma actual no distingue con claridad entre cliente persona natural, contador certificado y asesor financiero.
- Tampoco existe todavía un expediente financiero anual ni un caso tributario como agregados del negocio.

## Lectura del modelo vigente

- `TrackingEntity` ya se comporta como un contenedor de información auditable y compartible.
- `TrackingEntityItem` funciona más como categoría o frente de seguimiento que como "ítem" financiero de largo plazo.
- `TrackingEntityRecord` hoy mezcla movimientos económicos con registro operativo.
- `TrackingEntityAllocation` sirve para movimientos internos, pero no para todos los eventos financieros reales del usuario.
- `TrackingEntityShare` sí encaja como base para permisos y colaboración, aunque necesita reglas más expresivas.

## Conclusión de diagnóstico

- Conviene conservar el esqueleto de usuarios, auditoría, login history, settings y sharing.
- Conviene adaptar el concepto de entidad, no eliminarlo.
- Conviene dejar de crecer sobre `TrackingEntityItem` como pieza principal del nuevo producto.
- Conviene introducir un nuevo núcleo de dominio paralelo y migrar progresivamente.

# Propuesta del nuevo modelo de dominio

## Visión funcional

La nueva plataforma debe girar sobre cuatro agregados de negocio:

1. Cliente persona natural.
2. Expediente financiero anual.
3. Entidad financiera organizada dentro del expediente.
4. Caso tributario con seguimiento profesional.

## Nuevos roles del sistema

### Roles de negocio

- `PERSON_NATURAL`: dueño de su información financiera, soportes y relaciones.
- `ACCOUNTANT`: contador certificado que revisa expediente, soportes y avance tributario.
- `FINANCIAL_ADVISOR`: asesor financiero que acompaña orden, planeación y seguimiento.
- `PLATFORM_ADMIN`: administración interna de la plataforma.

### Recomendación técnica

- Mantener temporalmente `UserRole` actual para compatibilidad operativa.
- Introducir una capa nueva de perfil de negocio y relaciones profesionales.
- Migrar permisos del producto al nuevo dominio sin romper primero la administración existente.

## Nuevo vocabulario del dominio

- `Cliente`: usuario persona natural que organiza su información.
- `ExpedienteFinanciero`: contenedor anual del caso financiero del cliente.
- `EntidadFinanciera`: unidad organizadora dentro del expediente.
- `MovimientoFinanciero`: evento económico clasificado como ingreso o gasto.
- `SoporteDocumental`: documento o evidencia asociado a expediente, entidad o movimiento.
- `CasoTributario`: seguimiento del año gravable y estado del proceso de renta.
- `RelacionProfesional`: vínculo entre cliente y contador o asesor.

## Transformación del modelo actual

### Modelos que se mantienen

- `User`: se mantiene como identidad principal.
- `AuditLog`: se mantiene y gana más contexto de negocio.
- `LoginHistory`: se mantiene.
- `UserSetting`: se mantiene.
- `PlatformSetting`: se mantiene.

### Modelos que se adaptan

- `TrackingEntity` debe evolucionar hacia `FinancialEntity`.
  Debe representar una unidad separada de control financiero dentro del expediente.
  Ejemplos: patrimonio personal, actividad independiente, inmueble arrendado, vehículo, hogar, inversión o cuenta consolidada.

- `TrackingEntityShare` debe evolucionar hacia `FinancialEntityAccess`.
  Debe soportar permiso por rol de colaboración y contexto profesional.

### Modelos que deben dejar de ser núcleo

- `TrackingEntityItem` debe dividirse entre categorías financieras, conceptos observables y carpetas documentales.
- `TrackingEntityRecord` debe reemplazarse por `FinancialMovement`.
- `TrackingEntityAllocation` debe reinterpretarse como movimiento interno o transferencia solo donde aplique, no como pieza base.

### Modelos nuevos recomendados

- `ClientProfile`
- `ProfessionalProfile`
- `ProfessionalCredential`
- `ClientProfessionalLink`
- `FinancialDossier`
- `FinancialEntity`
- `FinancialMovement`
- `FinancialMovementAttachment`
- `DocumentSupport`
- `TaxCase`
- `TaxCaseTimeline`
- `EntityNote`

## Mapeo recomendado del modelo actual al nuevo dominio

| Actual | Acción | Nuevo nombre sugerido | Motivo |
|---|---|---|---|
| `TrackingEntity` | Adaptar | `FinancialEntity` | El concepto sí sirve, pero debe expresar una unidad financiera y no solo un grupo genérico. |
| `TrackingEntityItem` | Reemplazar | `FinancialConcept` o categorías/documentos/notas | Hoy mezcla demasiado. |
| `TrackingEntityRecord` | Reemplazar | `FinancialMovement` | El negocio necesita ingresos y gastos explícitos. |
| `TrackingEntityAllocation` | Adaptar | `FinancialTransfer` o movimiento interno | Solo útil para ciertos casos. |
| `TrackingEntityShare` | Adaptar | `FinancialEntityAccess` | Debe entender cliente, contador y asesor. |

# MVP inicial

## Objetivo del MVP

Construir la base operativa para que una persona natural en Colombia organice su año financiero, comparta controladamente su información y permita revisión profesional.

## Módulos mínimos

### 1. Identidad y perfiles

- Registro y acceso.
- Perfil de persona natural.
- Perfil profesional.
- Estado de verificación profesional manual o asistida por admin.

### 2. Expediente financiero anual

- Crear expediente por año gravable.
- Estado del expediente: `OPEN`, `IN_REVIEW`, `READY_FOR_TAX`, `ARCHIVED`.
- Resumen anual del cliente.

### 3. Entidades financieras

- Crear entidades dentro del expediente.
- Clasificar entidad por tipo y propósito.
- Mantener ingresos, gastos, observaciones y soportes por separado.

### 4. Movimientos financieros

- Registrar ingreso o gasto.
- Fecha, monto, categoría, observaciones y fuente.
- Asociación a entidad financiera.

### 5. Soportes documentales

- Subir documentos o dejar preparado el modelo para subirlos.
- Asociar soporte a expediente, entidad o movimiento.
- Trazabilidad de quién lo cargó y cuándo.

### 6. Relación cliente-profesional

- Invitar contador o asesor.
- Aceptar relación.
- Otorgar permisos de lectura, edición y revisión.

### 7. Caso tributario inicial

- Crear caso tributario por expediente.
- Estados básicos.
- Checklist manual de avance.

## Lo que se difiere

- Cálculo automático de declaración.
- Integraciones con DIAN.
- Marketplace público completo.
- Motor documental avanzado con OCR.
- Reglas tributarias automáticas complejas.

# Cambios en base de datos

## Estrategia recomendada

No renombrar físicamente de inmediato los modelos actuales más usados. Es mejor crear el nuevo núcleo paralelo y luego migrar la experiencia funcional.

## Mantener

- `User`
- `AuditLog`
- `LoginHistory`
- `UserSetting`
- `PlatformSetting`

## Adaptar en una segunda fase

- `TrackingEntity`
- `TrackingEntityShare`

## Reemplazar progresivamente

- `TrackingEntityItem`
- `TrackingEntityRecord`
- `TrackingEntityAllocation`

## Crear ahora como base del nuevo núcleo

- `ClientProfile`
- `ProfessionalProfile`
- `ProfessionalCredential`
- `ClientProfessionalLink`
- `FinancialDossier`
- `FinancialEntity`
- `FinancialEntityAccess`
- `FinancialMovement`
- `DocumentSupport`
- `TaxCase`

## Relación sugerida entre nuevos modelos

- Un `User` puede tener `ClientProfile`, `ProfessionalProfile` o ambos.
- Un `ClientProfile` puede tener muchos `FinancialDossier`.
- Un `FinancialDossier` pertenece a un cliente y un año fiscal.
- Un `FinancialDossier` contiene muchas `FinancialEntity`.
- Una `FinancialEntity` contiene muchos `FinancialMovement`, `DocumentSupport` y `EntityNote`.
- Un `FinancialDossier` puede tener un `TaxCase`.
- Un cliente puede relacionarse con varios profesionales mediante `ClientProfessionalLink`.

# Cambios en backend

## Arquitectura recomendada

Separar por módulos de negocio, no por tablas sueltas:

- `auth`
- `profiles`
- `relationships`
- `dossiers`
- `financial-entities`
- `movements`
- `documents`
- `tax-cases`
- `audit`
- `settings`

## Primeras rutas API recomendadas

- `GET /api/v1/product-blueprint`
- `GET /api/v1/profiles/me`
- `PATCH /api/v1/profiles/me/client`
- `PATCH /api/v1/profiles/me/professional`
- `GET /api/v1/dossiers`
- `POST /api/v1/dossiers`
- `GET /api/v1/dossiers/:dossierId`
- `POST /api/v1/dossiers/:dossierId/entities`
- `GET /api/v1/entities/:entityId/movements`
- `POST /api/v1/entities/:entityId/movements`
- `GET /api/v1/entities/:entityId/documents`
- `POST /api/v1/entities/:entityId/documents`
- `GET /api/v1/relationships`
- `POST /api/v1/relationships/invitations`
- `PATCH /api/v1/relationships/:relationshipId`
- `GET /api/v1/tax-cases/:dossierId`
- `POST /api/v1/tax-cases/:dossierId`

## Primer paso implementable sin romper el sistema actual

- Publicar un contrato oficial del rediseño desde backend.
- Usarlo como fuente de verdad para producto y desarrollo.
- Mantener el backend actual operativo mientras se construye el nuevo núcleo.

# Cambios en frontend

## Pantallas iniciales en React

- Login y registro con selección de perfil inicial.
- Dashboard personal del cliente.
- Lista de expedientes financieros.
- Detalle del expediente por año.
- Vista de entidades financieras del expediente.
- Registro de ingresos y gastos por entidad.
- Centro de documentos y soportes.
- Relación con contador y asesor.
- Panel administrativo de rediseño y evolución del producto.

## Estructura de frontend recomendada

- `features/profiles`
- `features/dossiers`
- `features/entities`
- `features/movements`
- `features/documents`
- `features/relationships`
- `features/tax`
- `features/admin`

## Primer paso implementable en frontend

- Crear una pantalla administrativa que consuma el blueprint del nuevo producto.
- Mostrar allí dominio, MVP, cambios de base de datos, API inicial y orden de implementación.
- Usar esa pantalla como referencia viva del rediseño.

# Orden de implementación recomendado

1. Definir y versionar el blueprint funcional y técnico.
2. Crear perfiles de negocio y relaciones cliente-profesional.
3. Crear expediente financiero anual.
4. Crear nueva entidad financiera dentro del expediente.
5. Crear movimientos de ingresos y gastos por entidad.
6. Crear soportes documentales asociados.
7. Crear caso tributario básico y checklist.
8. Migrar progresivamente la UI principal al nuevo flujo.
9. Desacoplar gradualmente piezas viejas del dominio actual.

# Riesgos y decisiones importantes

## Riesgos si mantienes demasiado del modelo actual

- Seguirás cargando semántica genérica donde el negocio ya necesita semántica financiera clara.
- `TrackingEntityItem` y `TrackingEntityRecord` seguirán forzando modelos ambiguos.
- El producto crecerá con deuda conceptual justo donde más claridad requiere: cliente, expediente y caso tributario.

## Riesgos si rediseñas todo de golpe

- Rompes funcionalidades útiles que hoy sí sirven.
- Multiplicas el riesgo de migración y de regresiones.
- Retrasas demasiado el MVP real.

## Decisión recomendada

Conviene una refactorización progresiva con nuevo núcleo de dominio, no un parche incremental infinito ni una reescritura total inmediata.

## Recomendación clara

- Reutiliza autenticación, auditoría, settings, sharing base y componentes UI.
- Crea desde ahora el nuevo vocabulario del dominio.
- Mantén compatibilidad temporal con el modelo anterior.
- Migra por módulos funcionales empezando por perfiles, expediente, entidades y movimientos.
