import { HttpError } from './http-error';

const USER_ICON_OPTIONS = [
  'user-round',
  'briefcase',
  'building-2',
  'house',
  'hard-hat',
  'badge-dollar-sign',
] as const;

const THEME_PRESETS = ['LIGHT', 'DARK', 'GRAPHITE', 'CUSTOM'] as const;
const THEME_BASE_PRESETS = ['LIGHT', 'DARK'] as const;
const ENTITY_SHARE_PERMISSIONS = ['VIEW', 'EDIT', 'MANAGE'] as const;
const USER_ROLES = ['ADMIN', 'MANAGER', 'ANALYST', 'OPERATOR'] as const;
const RECORD_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
const FINANCIAL_ACCOUNT_TYPES = [
  'AHORROS',
  'CORRIENTE',
  'BILLETERA',
  'OTRO',
] as const;
const FINANCIAL_ENTRY_DIRECTIONS = ['INCOME', 'EXPENSE'] as const;
const FINANCIAL_PERIOD_STATUSES = ['OPEN', 'CLOSED', 'ARCHIVED'] as const;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PlainObject = Record<string, unknown>;

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  birthDate: string;
};

export type UpdateSettingsInput = Partial<{
  themePreset: (typeof THEME_PRESETS)[number];
  customThemeBase: (typeof THEME_BASE_PRESETS)[number];
  userIcon: (typeof USER_ICON_OPTIONS)[number];
  dashboardSurfaceColor: string;
  dashboardPanelColor: string;
  dashboardPanelStrongColor: string;
  dashboardInkColor: string;
  dashboardMutedColor: string;
  dashboardLineColor: string;
  dashboardBrandColor: string;
  dashboardBrandSoftColor: string;
  dashboardBrandDeepColor: string;
  dashboardSuccessColor: string;
  dashboardDangerColor: string;
  dashboardWarningColor: string;
}>;

export type UpdatePlatformSettingsInput = Partial<{
  platformName: string;
  platformLabel: string;
  platformMotto: string;
  timezone: string;
  currencyCode: string;
  supportEmail: string;
}>;

export type CreatePlatformBankInput = {
  name: string;
};

export type CreateEntityShareInput = {
  username: string;
  permission: (typeof ENTITY_SHARE_PERMISSIONS)[number];
};

export type UpdateEntityShareInput = {
  permission: (typeof ENTITY_SHARE_PERMISSIONS)[number];
};

export type CreateEntityInput = {
  name: string;
  description?: string;
};

export type CreateEntityItemInput = {
  name: string;
  paymentReference?: string;
};

export type CreateEntityRecordInput = {
  amount: number;
  occurredAt?: string;
  notes?: string;
  categoryId?: string;
  subcategoryId?: string;
};

export type CreateEntityAllocationInput = {
  amount: number;
  occurredAt?: string;
  sourceLabel?: string;
  sourceAccountId?: string;
};

export type UpdateEntityRecordInput = {
  amount?: number;
  occurredAt?: string;
  categoryId?: string;
  subcategoryId?: string;
};

export type UpdateEntityAllocationInput = {
  amount?: number;
  occurredAt?: string;
  sourceLabel?: string;
};

export type CreateFinancialAccountInput = {
  bankName: string;
  accountLabel: string;
  accountType: (typeof FINANCIAL_ACCOUNT_TYPES)[number];
  accountMask?: string;
};

export type CreateFinancialIncomeInput = {
  amount: number;
  occurredAt?: string;
  categoryId?: string;
  subcategoryId?: string;
  sourceLabel?: string;
};

export type CreateFinancialPeriodInput = {
  year: number;
  month: number;
  status?: (typeof FINANCIAL_PERIOD_STATUSES)[number];
};

export type CreateFinancialCategoryInput = {
  direction: (typeof FINANCIAL_ENTRY_DIRECTIONS)[number];
  name: string;
  description?: string;
};

export type CreateFinancialSubcategoryInput = {
  categoryId: string;
  name: string;
  description?: string;
};

export type UpdateManagedUserInput = Partial<{
  username: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  role: (typeof USER_ROLES)[number];
  status: (typeof RECORD_STATUSES)[number];
  newPassword: string;
}>;

function ensurePlainObject(value: unknown) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new HttpError(
      400,
      'El cuerpo de la solicitud debe ser un objeto JSON',
    );
  }

  return value as PlainObject;
}

function assertAllowedKeys(
  payload: PlainObject,
  allowedKeys: readonly string[],
) {
  const invalidKeys = Object.keys(payload).filter(
    (key) => !allowedKeys.includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new HttpError(
      400,
      `Campos no permitidos: ${invalidKeys.join(', ')}`,
      invalidKeys,
    );
  }
}

function readRequiredString(
  payload: PlainObject,
  key: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  },
) {
  const value = payload[key];

  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${key} debe ser texto`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new HttpError(400, `El campo ${key} es obligatorio`);
  }

  if (options?.minLength && trimmedValue.length < options.minLength) {
    throw new HttpError(
      400,
      `El campo ${key} debe tener minimo ${options.minLength} caracteres`,
    );
  }

  if (options?.maxLength && trimmedValue.length > options.maxLength) {
    throw new HttpError(
      400,
      `El campo ${key} debe tener maximo ${options.maxLength} caracteres`,
    );
  }

  if (options?.pattern && !options.pattern.test(trimmedValue)) {
    throw new HttpError(
      400,
      options.patternMessage ?? `El campo ${key} no es valido`,
    );
  }

  return trimmedValue;
}

function readOptionalString(
  payload: PlainObject,
  key: string,
  options?: {
    maxLength?: number;
  },
) {
  const value = payload[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${key} debe ser texto`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (options?.maxLength && trimmedValue.length > options.maxLength) {
    throw new HttpError(
      400,
      `El campo ${key} debe tener maximo ${options.maxLength} caracteres`,
    );
  }

  return trimmedValue;
}

function readRequiredDateString(payload: PlainObject, key: string) {
  const value = readRequiredString(payload, key);

  if (Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `El campo ${key} debe ser una fecha valida`);
  }

  return value;
}

function assertMinimumAge(
  dateString: string,
  minimumAge: number,
  field: string,
) {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  if (age < minimumAge) {
    throw new HttpError(
      400,
      `El campo ${field} requiere una edad minima de ${minimumAge} anos`,
    );
  }
}

function readOptionalDateString(payload: PlainObject, key: string) {
  const value = payload[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `El campo ${key} debe ser una fecha valida`);
  }

  return value;
}

function readRequiredNumber(
  payload: PlainObject,
  key: string,
  options?: {
    min?: number;
    maxDecimalPlaces?: number;
  },
) {
  const value = payload[key];

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HttpError(400, `El campo ${key} debe ser numerico`);
  }

  if (options?.min !== undefined && value < options.min) {
    throw new HttpError(
      400,
      `El campo ${key} no puede ser menor a ${options.min}`,
    );
  }

  if (options?.maxDecimalPlaces !== undefined) {
    const decimals = value.toString().split('.')[1]?.length ?? 0;

    if (decimals > options.maxDecimalPlaces) {
      throw new HttpError(
        400,
        `El campo ${key} admite maximo ${options.maxDecimalPlaces} decimales`,
      );
    }
  }

  return value;
}

function readOptionalNumber(
  payload: PlainObject,
  key: string,
  options?: {
    min?: number;
    maxDecimalPlaces?: number;
  },
) {
  if (!(key in payload)) {
    return undefined;
  }

  return readRequiredNumber(payload, key, options);
}

function assertInteger(value: number, field: string) {
  if (!Number.isInteger(value)) {
    throw new HttpError(400, `El campo ${field} debe ser un numero entero`);
  }
}

function readOptionalEnum<T extends readonly string[]>(
  payload: PlainObject,
  key: string,
  allowedValues: T,
): T[number] | undefined {
  const value = payload[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new HttpError(
      400,
      `El campo ${key} debe ser uno de: ${allowedValues.join(', ')}`,
    );
  }

  return value as T[number];
}

function readRequiredEnum<T extends readonly string[]>(
  payload: PlainObject,
  key: string,
  allowedValues: T,
): T[number] {
  const value = readOptionalEnum(payload, key, allowedValues);

  if (!value) {
    throw new HttpError(
      400,
      `El campo ${key} debe ser uno de: ${allowedValues.join(', ')}`,
    );
  }

  return value;
}

function readOptionalHexColor(payload: PlainObject, key: string) {
  const value = payload[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value.trim())) {
    throw new HttpError(
      400,
      `El campo ${key} debe ser un color hexadecimal valido`,
    );
  }

  return value.trim();
}

function readUpdatableString(
  payload: PlainObject,
  key: string,
  options?: {
    maxLength?: number;
  },
) {
  if (!(key in payload)) {
    return undefined;
  }

  const value = payload[key];

  if (typeof value !== 'string') {
    throw new HttpError(400, `El campo ${key} debe ser texto`);
  }

  const trimmedValue = value.trim();

  if (options?.maxLength && trimmedValue.length > options.maxLength) {
    throw new HttpError(
      400,
      `El campo ${key} debe tener maximo ${options.maxLength} caracteres`,
    );
  }

  return trimmedValue;
}

function assertAtLeastOneKey(payload: PlainObject, keys: readonly string[]) {
  if (!keys.some((key) => key in payload)) {
    throw new HttpError(
      400,
      `Debes enviar al menos uno de estos campos: ${keys.join(', ')}`,
    );
  }
}

export function parseRegisterInput(value: unknown): RegisterInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'firstName',
    'lastName',
    'email',
    'nationalId',
    'birthDate',
    'password',
    'confirmPassword',
  ]);

  const birthDate = readRequiredDateString(payload, 'birthDate');
  const password = readRequiredString(payload, 'password', {
    minLength: 8,
  });
  const confirmPassword = readRequiredString(payload, 'confirmPassword', {
    minLength: 8,
  });

  if (password !== confirmPassword) {
    throw new HttpError(400, 'La confirmacion de contrasena no coincide');
  }

  assertMinimumAge(birthDate, 14, 'birthDate');

  return {
    firstName: readRequiredString(payload, 'firstName', {
      minLength: 2,
      maxLength: 60,
    }),
    lastName: readRequiredString(payload, 'lastName', {
      minLength: 2,
      maxLength: 60,
    }),
    email: readRequiredString(payload, 'email', {
      maxLength: 120,
      pattern: EMAIL_REGEX,
      patternMessage: 'El correo electronico no es valido',
    }).toLowerCase(),
    nationalId: readRequiredString(payload, 'nationalId', {
      minLength: 6,
      maxLength: 20,
      pattern: /^[0-9]+$/,
      patternMessage: 'La cedula solo puede contener numeros',
    }),
    birthDate,
    password,
    confirmPassword,
  };
}

export function parseLoginInput(value: unknown): LoginInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['identifier', 'password']);

  return {
    identifier: readRequiredString(payload, 'identifier', {
      minLength: 3,
      maxLength: 120,
    }),
    password: readRequiredString(payload, 'password', {
      minLength: 8,
    }),
  };
}

export function parseChangePasswordInput(value: unknown): ChangePasswordInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['currentPassword', 'newPassword']);

  return {
    currentPassword: readRequiredString(payload, 'currentPassword'),
    newPassword: readRequiredString(payload, 'newPassword', {
      minLength: 8,
    }),
  };
}

export function parseUpdateProfileInput(value: unknown): UpdateProfileInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['firstName', 'lastName', 'birthDate']);

  const birthDate = readRequiredDateString(payload, 'birthDate');
  assertMinimumAge(birthDate, 14, 'birthDate');

  return {
    firstName: readRequiredString(payload, 'firstName', {
      minLength: 2,
      maxLength: 60,
    }),
    lastName: readRequiredString(payload, 'lastName', {
      minLength: 2,
      maxLength: 60,
    }),
    birthDate,
  };
}

export function parseUpdateSettingsInput(value: unknown): UpdateSettingsInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'themePreset',
    'customThemeBase',
    'userIcon',
    'dashboardSurfaceColor',
    'dashboardPanelColor',
    'dashboardPanelStrongColor',
    'dashboardInkColor',
    'dashboardMutedColor',
    'dashboardLineColor',
    'dashboardBrandColor',
    'dashboardBrandSoftColor',
    'dashboardBrandDeepColor',
    'dashboardSuccessColor',
    'dashboardDangerColor',
    'dashboardWarningColor',
  ]);

  return {
    themePreset: readOptionalEnum(payload, 'themePreset', THEME_PRESETS),
    customThemeBase: readOptionalEnum(
      payload,
      'customThemeBase',
      THEME_BASE_PRESETS,
    ),
    userIcon: readOptionalEnum(payload, 'userIcon', USER_ICON_OPTIONS),
    dashboardSurfaceColor: readOptionalHexColor(
      payload,
      'dashboardSurfaceColor',
    ),
    dashboardPanelColor: readOptionalHexColor(payload, 'dashboardPanelColor'),
    dashboardPanelStrongColor: readOptionalHexColor(
      payload,
      'dashboardPanelStrongColor',
    ),
    dashboardInkColor: readOptionalHexColor(payload, 'dashboardInkColor'),
    dashboardMutedColor: readOptionalHexColor(payload, 'dashboardMutedColor'),
    dashboardLineColor: readOptionalHexColor(payload, 'dashboardLineColor'),
    dashboardBrandColor: readOptionalHexColor(payload, 'dashboardBrandColor'),
    dashboardBrandSoftColor: readOptionalHexColor(
      payload,
      'dashboardBrandSoftColor',
    ),
    dashboardBrandDeepColor: readOptionalHexColor(
      payload,
      'dashboardBrandDeepColor',
    ),
    dashboardSuccessColor: readOptionalHexColor(
      payload,
      'dashboardSuccessColor',
    ),
    dashboardDangerColor: readOptionalHexColor(payload, 'dashboardDangerColor'),
    dashboardWarningColor: readOptionalHexColor(
      payload,
      'dashboardWarningColor',
    ),
  };
}

export function parseUpdatePlatformSettingsInput(
  value: unknown,
): UpdatePlatformSettingsInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'platformName',
    'platformLabel',
    'platformMotto',
    'timezone',
    'currencyCode',
    'supportEmail',
  ]);
  assertAtLeastOneKey(payload, [
    'platformName',
    'platformLabel',
    'platformMotto',
    'timezone',
    'currencyCode',
    'supportEmail',
  ]);

  return {
    platformName: readUpdatableString(payload, 'platformName', {
      maxLength: 80,
    }),
    platformLabel: readUpdatableString(payload, 'platformLabel', {
      maxLength: 40,
    }),
    platformMotto: readUpdatableString(payload, 'platformMotto', {
      maxLength: 160,
    }),
    timezone: readUpdatableString(payload, 'timezone', {
      maxLength: 60,
    }),
    currencyCode: readUpdatableString(payload, 'currencyCode', {
      maxLength: 8,
    }),
    supportEmail: readUpdatableString(payload, 'supportEmail', {
      maxLength: 120,
    }),
  };
}

export function parseCreatePlatformBankInput(
  value: unknown,
): CreatePlatformBankInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['name']);

  return {
    name: readRequiredString(payload, 'name', {
      minLength: 2,
      maxLength: 80,
    }),
  };
}

export function parseCreateEntityShareInput(
  value: unknown,
): CreateEntityShareInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['username', 'permission']);

  return {
    username: readRequiredString(payload, 'username', {
      minLength: 3,
      maxLength: 30,
    })
      .replace(/^@+/, '')
      .toLowerCase(),
    permission: readRequiredEnum(
      payload,
      'permission',
      ENTITY_SHARE_PERMISSIONS,
    ),
  };
}

export function parseUpdateEntityShareInput(
  value: unknown,
): UpdateEntityShareInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['permission']);

  return {
    permission: readRequiredEnum(
      payload,
      'permission',
      ENTITY_SHARE_PERMISSIONS,
    ),
  };
}

export function parseCreateEntityInput(value: unknown): CreateEntityInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['name', 'description']);

  return {
    name: readRequiredString(payload, 'name', {
      minLength: 2,
      maxLength: 120,
    }),
    description: readOptionalString(payload, 'description', {
      maxLength: 280,
    }),
  };
}

export function parseCreateEntityItemInput(
  value: unknown,
): CreateEntityItemInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['name', 'paymentReference']);

  return {
    name: readRequiredString(payload, 'name', {
      minLength: 2,
      maxLength: 120,
    }),
    paymentReference: readOptionalString(payload, 'paymentReference', {
      maxLength: 80,
    }),
  };
}

export function parseCreateEntityRecordInput(
  value: unknown,
): CreateEntityRecordInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'amount',
    'occurredAt',
    'notes',
    'categoryId',
    'subcategoryId',
  ]);

  const categoryId = readOptionalString(payload, 'categoryId', {
    maxLength: 120,
  });
  const subcategoryId = readOptionalString(payload, 'subcategoryId', {
    maxLength: 120,
  });

  if (subcategoryId && !categoryId) {
    throw new HttpError(
      400,
      'Debes seleccionar una categoria antes de elegir la subcategoria',
    );
  }

  return {
    amount: readRequiredNumber(payload, 'amount', {
      min: 0,
      maxDecimalPlaces: 2,
    }),
    occurredAt: readOptionalDateString(payload, 'occurredAt'),
    notes: readOptionalString(payload, 'notes', {
      maxLength: 280,
    }),
    categoryId,
    subcategoryId,
  };
}

export function parseCreateEntityAllocationInput(
  value: unknown,
): CreateEntityAllocationInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'amount',
    'occurredAt',
    'sourceLabel',
    'sourceAccountId',
  ]);

  return {
    amount: readRequiredNumber(payload, 'amount', {
      min: 0,
      maxDecimalPlaces: 2,
    }),
    occurredAt: readOptionalDateString(payload, 'occurredAt'),
    sourceLabel: readOptionalString(payload, 'sourceLabel', {
      maxLength: 120,
    }),
    sourceAccountId: readOptionalString(payload, 'sourceAccountId', {
      maxLength: 120,
    }),
  };
}

export function parseUpdateEntityRecordInput(
  value: unknown,
): UpdateEntityRecordInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'amount',
    'occurredAt',
    'categoryId',
    'subcategoryId',
  ]);
  assertAtLeastOneKey(payload, [
    'amount',
    'occurredAt',
    'categoryId',
    'subcategoryId',
  ]);

  const categoryId = readOptionalString(payload, 'categoryId', {
    maxLength: 120,
  });
  const subcategoryId = readOptionalString(payload, 'subcategoryId', {
    maxLength: 120,
  });

  if (subcategoryId && !categoryId) {
    throw new HttpError(
      400,
      'Debes seleccionar una categoria antes de elegir la subcategoria',
    );
  }

  return {
    amount: readOptionalNumber(payload, 'amount', {
      min: 0,
      maxDecimalPlaces: 2,
    }),
    occurredAt: readOptionalDateString(payload, 'occurredAt'),
    categoryId,
    subcategoryId,
  };
}

export function parseUpdateEntityAllocationInput(
  value: unknown,
): UpdateEntityAllocationInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['amount', 'occurredAt', 'sourceLabel']);
  assertAtLeastOneKey(payload, ['amount', 'occurredAt', 'sourceLabel']);

  return {
    amount: readOptionalNumber(payload, 'amount', {
      min: 0,
      maxDecimalPlaces: 2,
    }),
    occurredAt: readOptionalDateString(payload, 'occurredAt'),
    sourceLabel: readUpdatableString(payload, 'sourceLabel', {
      maxLength: 120,
    }),
  };
}

export function parseCreateFinancialAccountInput(
  value: unknown,
): CreateFinancialAccountInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'bankName',
    'accountLabel',
    'accountType',
    'accountMask',
  ]);

  return {
    bankName: readRequiredString(payload, 'bankName', {
      minLength: 2,
      maxLength: 120,
    }),
    accountLabel: readRequiredString(payload, 'accountLabel', {
      minLength: 2,
      maxLength: 120,
    }),
    accountType: readRequiredEnum(
      payload,
      'accountType',
      FINANCIAL_ACCOUNT_TYPES,
    ),
    accountMask: readOptionalString(payload, 'accountMask', {
      maxLength: 12,
    }),
  };
}

export function parseCreateFinancialIncomeInput(
  value: unknown,
): CreateFinancialIncomeInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'amount',
    'occurredAt',
    'categoryId',
    'subcategoryId',
    'sourceLabel',
  ]);

  const categoryId = readOptionalString(payload, 'categoryId', {
    maxLength: 120,
  });
  const subcategoryId = readOptionalString(payload, 'subcategoryId', {
    maxLength: 120,
  });

  if (subcategoryId && !categoryId) {
    throw new HttpError(
      400,
      'Debes seleccionar una categoria antes de elegir la subcategoria',
    );
  }

  return {
    amount: readRequiredNumber(payload, 'amount', {
      min: 0,
      maxDecimalPlaces: 2,
    }),
    occurredAt: readOptionalDateString(payload, 'occurredAt'),
    categoryId,
    subcategoryId,
    sourceLabel: readOptionalString(payload, 'sourceLabel', {
      maxLength: 160,
    }),
  };
}

export function parseCreateFinancialPeriodInput(
  value: unknown,
): CreateFinancialPeriodInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['year', 'month', 'status']);

  const year = readRequiredNumber(payload, 'year', { min: 2000 });
  const month = readRequiredNumber(payload, 'month', { min: 1 });

  assertInteger(year, 'year');
  assertInteger(month, 'month');

  if (month > 12) {
    throw new HttpError(400, 'El campo month no puede ser mayor a 12');
  }

  return {
    year,
    month,
    status: readOptionalEnum(payload, 'status', FINANCIAL_PERIOD_STATUSES),
  };
}

export function parseCreateFinancialCategoryInput(
  value: unknown,
): CreateFinancialCategoryInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['direction', 'name', 'description']);

  return {
    direction: readRequiredEnum(
      payload,
      'direction',
      FINANCIAL_ENTRY_DIRECTIONS,
    ),
    name: readRequiredString(payload, 'name', {
      minLength: 2,
      maxLength: 80,
    }),
    description: readOptionalString(payload, 'description', {
      maxLength: 180,
    }),
  };
}

export function parseCreateFinancialSubcategoryInput(
  value: unknown,
): CreateFinancialSubcategoryInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, ['categoryId', 'name', 'description']);

  return {
    categoryId: readRequiredString(payload, 'categoryId', {
      minLength: 8,
      maxLength: 120,
    }),
    name: readRequiredString(payload, 'name', {
      minLength: 2,
      maxLength: 80,
    }),
    description: readOptionalString(payload, 'description', {
      maxLength: 180,
    }),
  };
}

export function parseUpdateManagedUserInput(
  value: unknown,
): UpdateManagedUserInput {
  const payload = ensurePlainObject(value);
  assertAllowedKeys(payload, [
    'username',
    'firstName',
    'lastName',
    'nationalId',
    'birthDate',
    'role',
    'status',
    'newPassword',
  ]);
  assertAtLeastOneKey(payload, [
    'username',
    'firstName',
    'lastName',
    'nationalId',
    'birthDate',
    'role',
    'status',
    'newPassword',
  ]);

  const username = readUpdatableString(payload, 'username', {
    maxLength: 30,
  });
  const firstName = readUpdatableString(payload, 'firstName', {
    maxLength: 60,
  });
  const lastName = readUpdatableString(payload, 'lastName', {
    maxLength: 60,
  });
  const nationalId = readUpdatableString(payload, 'nationalId', {
    maxLength: 20,
  });
  const newPassword = readUpdatableString(payload, 'newPassword', {
    maxLength: 120,
  });

  if (username !== undefined && username.length < 3) {
    throw new HttpError(
      400,
      'El campo username debe tener minimo 3 caracteres',
    );
  }

  if (firstName !== undefined && firstName.length < 2) {
    throw new HttpError(
      400,
      'El campo firstName debe tener minimo 2 caracteres',
    );
  }

  if (lastName !== undefined && lastName.length < 2) {
    throw new HttpError(
      400,
      'El campo lastName debe tener minimo 2 caracteres',
    );
  }

  if (nationalId !== undefined && !/^[0-9]+$/.test(nationalId)) {
    throw new HttpError(400, 'La cedula solo puede contener numeros');
  }

  if (newPassword !== undefined && newPassword.length < 8) {
    throw new HttpError(
      400,
      'El campo newPassword debe tener minimo 8 caracteres',
    );
  }

  return {
    username,
    firstName,
    lastName,
    nationalId,
    birthDate: readOptionalDateString(payload, 'birthDate'),
    role: readOptionalEnum(payload, 'role', USER_ROLES),
    status: readOptionalEnum(payload, 'status', RECORD_STATUSES),
    newPassword,
  };
}
