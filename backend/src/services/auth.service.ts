import { RecordStatus, type Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AppConfig } from '../config/app-config';
import { HttpError } from '../lib/http-error';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../lib/validation';
import { PrismaService } from '../lib/prisma';
import type { AuthUser, RequestMetadata } from '../types/auth';
import { AuditService } from './audit.service';

export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterInput, metadata?: RequestMetadata) {
    const nationalId = dto.nationalId.trim();
    const existingUserByNationalId = await this.prisma.user.findUnique({
      where: { nationalId },
    });

    if (existingUserByNationalId) {
      throw new HttpError(400, 'Ya existe un usuario con esa cedula');
    }

    const firstName = this.normalizePersonName(dto.firstName);
    const lastName = this.normalizePersonName(dto.lastName);
    const fullName = `${firstName} ${lastName}`;
    const username = await this.generateUsername(
      firstName,
      lastName,
      nationalId,
    );
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usersCount = await this.prisma.user.count();
    const nextRole = usersCount === 0 ? UserRole.ADMIN : UserRole.OPERATOR;

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        fullName,
        username,
        nationalId,
        birthDate: new Date(dto.birthDate),
        passwordHash,
        role: nextRole,
      },
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'CREATE',
      summary: `Registro de usuario ${user.username}`,
      performedById: user.id,
      after: {
        username: user.username,
        role: user.role,
        nationalIdMasked: this.maskNationalId(user.nationalId),
        birthDate: user.birthDate,
      },
      metadata: {
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginInput, metadata?: RequestMetadata) {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user || user.status !== RecordStatus.ACTIVE) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    const loginDate = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: loginDate },
      }),
      this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          usernameSnapshot: user.username,
          loggedInAt: loginDate,
          ipAddress: metadata?.ipAddress ?? null,
          userAgent: metadata?.userAgent ?? null,
        },
      }),
    ]);

    await this.auditService.log({
      entityName: 'Auth',
      entityId: user.id,
      action: 'LOGIN',
      summary: `Inicio de sesion de ${user.username}`,
      performedById: user.id,
      metadata: {
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        loggedInAt: loginDate,
      },
    });

    return this.buildAuthResponse(user);
  }

  async changePassword(userId: string, dto: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(401, 'Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new HttpError(400, 'La contrasena actual no coincide');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'UPDATE',
      summary: `Cambio de contrasena para ${user.username}`,
      performedById: user.id,
    });

    return { success: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(401, 'Usuario no encontrado');
    }

    const firstName = this.normalizePersonName(dto.firstName);
    const lastName = this.normalizePersonName(dto.lastName);
    const fullName = `${firstName} ${lastName}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        fullName,
        birthDate: new Date(dto.birthDate),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        nationalId: true,
        birthDate: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'UPDATE',
      summary: `Actualizacion de perfil para ${user.username}`,
      performedById: user.id,
      after: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        birthDate: updatedUser.birthDate,
      },
    });

    return updatedUser;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        nationalId: true,
        birthDate: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new HttpError(401, 'Usuario no encontrado');
    }

    return user;
  }

  private buildAuthResponse(
    user: Prisma.UserGetPayload<Record<string, never>>,
  ) {
    const payload: AuthUser = {
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return {
      accessToken: jwt.sign(payload, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn as SignOptions['expiresIn'],
      }),
      user: payload,
    };
  }

  private normalizePersonName(value: string) {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private normalizeNameToken(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();
  }

  private async generateUsername(
    firstName: string,
    lastName: string,
    nationalId: string,
  ) {
    const firstSegment = this.normalizeNameToken(firstName).slice(0, 3);
    const lastSegment = this.normalizeNameToken(lastName).slice(0, 3);
    const nationalIdSegment = nationalId.slice(-3);
    const baseUsername = `${firstSegment}${lastSegment}${nationalIdSegment}`;

    let candidate = baseUsername;
    let suffix = 1;

    while (
      await this.prisma.user.findUnique({ where: { username: candidate } })
    ) {
      candidate = `${baseUsername}${suffix}`;
      suffix += 1;
    }

    return candidate.slice(0, 30);
  }

  private maskNationalId(value: string) {
    if (value.length <= 4) {
      return value;
    }

    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }
}
