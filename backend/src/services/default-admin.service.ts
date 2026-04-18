import { RecordStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { AppConfig } from '../config/app-config';
import { PrismaService } from '../lib/prisma';
import { AuditService } from './audit.service';

export class DefaultAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly config: AppConfig,
  ) {}

  async ensureAdmin() {
    const existingAdmin = await this.prisma.user.findUnique({
      where: { username: this.config.defaultAdmin.username },
    });

    if (existingAdmin) {
      return;
    }

    const passwordHash = await bcrypt.hash(
      this.config.defaultAdmin.password,
      10,
    );
    const user = await this.prisma.user.create({
      data: {
        username: this.config.defaultAdmin.username,
        firstName: this.config.defaultAdmin.firstName,
        lastName: this.config.defaultAdmin.lastName,
        fullName: this.config.defaultAdmin.fullName,
        nationalId: this.config.defaultAdmin.nationalId,
        birthDate: new Date(this.config.defaultAdmin.birthDate),
        passwordHash,
        role: UserRole.ADMIN,
        status: RecordStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'CREATE',
      summary: `Creacion automatica del usuario administrador ${user.username}`,
      performedById: user.id,
      after: {
        username: user.username,
        role: user.role,
        defaultCredentials: true,
      },
    });

    console.warn(
      `Se creo el usuario administrador por defecto "${user.username}". Cambia la contrasena inicial despues del primer ingreso.`,
    );
  }
}
