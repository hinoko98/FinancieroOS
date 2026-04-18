import { RecordStatus, type Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
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
import { EmailService } from './email.service';

export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly config: AppConfig,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterInput, metadata?: RequestMetadata) {
    const nationalId = dto.nationalId.trim();
    const email = dto.email.trim().toLowerCase();

    const existingUserByNationalId = await this.prisma.user.findUnique({
      where: { nationalId },
    });

    if (existingUserByNationalId) {
      throw new HttpError(400, 'Ya existe un usuario con esa cedula');
    }

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new HttpError(
        400,
        'Ya existe un usuario con ese correo electronico',
      );
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        fullName,
        username,
        email,
        nationalId,
        birthDate: new Date(dto.birthDate),
        passwordHash,
        role: nextRole,
        status: RecordStatus.ACTIVE,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    const verificationUrl = `${this.config.publicApiUrl}/auth/verify-email?token=${verificationToken}`;
    const deliveryResult = await this.emailService.sendVerificationEmail({
      to: email,
      fullName,
      username,
      verificationUrl,
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'CREATE',
      summary: `Registro de usuario ${user.username}`,
      performedById: user.id,
      after: {
        username: user.username,
        email: user.email,
        role: user.role,
        nationalIdMasked: this.maskNationalId(user.nationalId),
        birthDate: user.birthDate,
        verificationExpiresAt,
      },
      metadata: {
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        delivery: deliveryResult.delivery,
      },
    });

    return {
      verificationRequired: true,
      email,
      delivery: deliveryResult.delivery,
    };
  }

  async login(dto: LoginInput, metadata?: RequestMetadata) {
    const identifier = dto.identifier.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    if (user.status !== RecordStatus.ACTIVE) {
      if (user.email && !user.emailVerifiedAt) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { status: RecordStatus.ACTIVE },
        });
      } else {
        throw new HttpError(401, 'Tu cuenta no se encuentra activa');
      }
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

  async verifyEmail(token: string) {
    const verificationToken = token.trim();

    if (!verificationToken) {
      throw new HttpError(400, 'Token de verificacion invalido');
    }

    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: verificationToken },
    });

    if (!user) {
      throw new HttpError(400, 'El token de verificacion no es valido');
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new HttpError(
        400,
        'El enlace de validacion expiro. Solicita uno nuevo desde tu perfil',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'ACTIVATE',
      summary: `Verificacion de correo para ${user.username}`,
      performedById: user.id,
    });
  }

  async resendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new HttpError(401, 'Usuario no encontrado');
    }

    if (!user.email) {
      throw new HttpError(
        400,
        'Tu cuenta no tiene correo electronico asociado',
      );
    }

    if (user.emailVerifiedAt) {
      return {
        email: user.email,
        delivery: 'EMAIL' as const,
        alreadyVerified: true,
        verificationExpiresAt: null,
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
        status: RecordStatus.ACTIVE,
      },
    });

    const verificationUrl = `${this.config.publicApiUrl}/auth/verify-email?token=${verificationToken}`;
    const deliveryResult = await this.emailService.sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      username: user.username,
      verificationUrl,
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: user.id,
      action: 'UPDATE',
      summary: `Reenvio de validacion de correo para ${user.username}`,
      performedById: user.id,
      after: {
        email: user.email,
        verificationExpiresAt,
      },
      metadata: {
        delivery: deliveryResult.delivery,
      },
    });

    return {
      email: user.email,
      delivery: deliveryResult.delivery,
      alreadyVerified: false,
      verificationExpiresAt,
    };
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
        emailVerifiedAt: true,
        emailVerificationExpiresAt: true,
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
        emailVerifiedAt: true,
        emailVerificationExpiresAt: true,
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
