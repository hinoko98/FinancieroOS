import { createApp } from './app';
import { loadConfig } from './config/app-config';
import { PrismaService } from './lib/prisma';
import { AdminService } from './services/admin.service';
import { AuditService } from './services/audit.service';
import { AuthService } from './services/auth.service';
import { DefaultAdminService } from './services/default-admin.service';
import { EmailService } from './services/email.service';
import { EntitiesService } from './services/entities.service';
import { FinanceService } from './services/finance.service';
import { SettingsService } from './services/settings.service';

async function bootstrap() {
  const config = loadConfig();
  const prisma = new PrismaService();

  await prisma.connect();

  const auditService = new AuditService(prisma);
  const adminService = new AdminService(prisma, auditService);
  const emailService = new EmailService(config);
  const authService = new AuthService(
    prisma,
    auditService,
    config,
    emailService,
  );
  const entitiesService = new EntitiesService(prisma, auditService);
  const financeService = new FinanceService(prisma, auditService);
  const settingsService = new SettingsService(prisma, auditService);
  const defaultAdminService = new DefaultAdminService(
    prisma,
    auditService,
    config,
  );

  await defaultAdminService.ensureAdmin();

  const app = createApp(config, {
    adminService,
    authService,
    auditService,
    entitiesService,
    financeService,
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
