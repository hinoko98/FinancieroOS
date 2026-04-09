import { createApp } from './app';
import { loadConfig } from './config/app-config';
import { PrismaService } from './lib/prisma';
import { AuditService } from './services/audit.service';
import { AuthService } from './services/auth.service';
import { DefaultAdminService } from './services/default-admin.service';
import { EntitiesService } from './services/entities.service';
import { SettingsService } from './services/settings.service';

async function bootstrap() {
  const config = loadConfig();
  const prisma = new PrismaService();

  await prisma.connect();

  const auditService = new AuditService(prisma);
  const authService = new AuthService(prisma, auditService, config);
  const entitiesService = new EntitiesService(prisma, auditService);
  const settingsService = new SettingsService(prisma, auditService);
  const defaultAdminService = new DefaultAdminService(
    prisma,
    auditService,
    config,
  );

  await defaultAdminService.ensureAdmin();

  const app = createApp(config, {
    authService,
    auditService,
    entitiesService,
    settingsService,
  });

  const server = app.listen(config.port, () => {
    console.log(
      `Control Financiero API escuchando en http://localhost:${config.port}`,
    );
  });

  const shutdown = () => {
    server.close(() => {
      void prisma.disconnect().finally(() => {
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap();
