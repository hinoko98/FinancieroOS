import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { AppConfig } from './config/app-config';
import { createOpenApiDocument } from './lib/openapi';
import { errorMiddleware } from './middlewares/error.middleware';
import { createAuditRouter } from './routes/audit.routes';
import { createAuthRouter } from './routes/auth.routes';
import { createEntitiesRouter } from './routes/entities.routes';
import { createFinanceRouter } from './routes/finance.routes';
import { createHealthRouter } from './routes/health.routes';
import { createSettingsRouter } from './routes/settings.routes';
import { createSystemRouter } from './routes/system.routes';
import type { AuditService } from './services/audit.service';
import type { AuthService } from './services/auth.service';
import type { EntitiesService } from './services/entities.service';
import type { FinanceService } from './services/finance.service';
import type { SettingsService } from './services/settings.service';

type AppServices = {
  authService: AuthService;
  auditService: AuditService;
  entitiesService: EntitiesService;
  financeService: FinanceService;
  settingsService: SettingsService;
};

export function createApp(config: AppConfig, services: AppServices) {
  const app = express();
  const openApiDocument = createOpenApiDocument();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/docs/openapi.json', (_request, response) => {
    response.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/v1', createSystemRouter());
  app.use('/api/v1/health', createHealthRouter());
  app.use(
    '/api/v1/auth',
    createAuthRouter(services.authService, config.jwtSecret),
  );
  app.use(
    '/api/v1/entities',
    createEntitiesRouter(services.entitiesService, config.jwtSecret),
  );
  app.use(
    '/api/v1/finance',
    createFinanceRouter(services.financeService, config.jwtSecret),
  );
  app.use(
    '/api/v1/settings',
    createSettingsRouter(services.settingsService, config.jwtSecret),
  );
  app.use(
    '/api/v1/audit',
    createAuditRouter(services.auditService, config.jwtSecret),
  );

  app.use('/api/v1/*rest', (_request, response) => {
    response.status(404).json({
      message: 'Ruta no encontrada',
    });
  });

  app.use(errorMiddleware);

  return app;
}
