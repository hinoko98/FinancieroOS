import 'dotenv/config';

export type AppConfig = {
  port: number;
  frontendUrl: string;
  publicApiUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };
  defaultAdmin: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    fullName: string;
    nationalId: string;
    birthDate: string;
  };
};

function readString(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readNumber(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();
  const parsedValue = rawValue ? Number(rawValue) : Number.NaN;
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function readBoolean(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return value === 'true' || value === '1' || value === 'yes';
}

export function loadConfig(): AppConfig {
  const firstName = readString('DEFAULT_ADMIN_FIRST_NAME', 'Admin');
  const lastName = readString('DEFAULT_ADMIN_LAST_NAME', 'Principal');

  return {
    port: readNumber('PORT', 3000),
    frontendUrl: readString('FRONTEND_URL', 'http://localhost:3001'),
    publicApiUrl: readString('PUBLIC_API_URL', 'http://localhost:3000/api/v1'),
    jwtSecret: readString('JWT_SECRET', 'change_me'),
    jwtExpiresIn: readString('JWT_EXPIRES_IN', '1d'),
    mail: {
      host: readString('SMTP_HOST', ''),
      port: readNumber('SMTP_PORT', 587),
      secure: readBoolean('SMTP_SECURE', false),
      user: readString('SMTP_USER', ''),
      password: readString('SMTP_PASSWORD', ''),
      from: readString('MAIL_FROM', 'no-reply@controlfinanciero.local'),
    },
    defaultAdmin: {
      username: readString('DEFAULT_ADMIN_USERNAME', 'admin').toLowerCase(),
      password: readString('DEFAULT_ADMIN_PASSWORD', 'admin123'),
      firstName,
      lastName,
      fullName: readString(
        'DEFAULT_ADMIN_FULL_NAME',
        `${firstName} ${lastName}`,
      ),
      nationalId: readString('DEFAULT_ADMIN_NATIONAL_ID', '1000000001'),
      birthDate: readString('DEFAULT_ADMIN_BIRTH_DATE', '1990-01-01'),
    },
  };
}
