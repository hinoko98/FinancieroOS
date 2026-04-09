
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'OPERATOR');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecordStatus') THEN
    CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'ACTIVATE', 'DEACTIVATE', 'LOGIN');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThemePreset') THEN
    CREATE TYPE "ThemePreset" AS ENUM ('LIGHT', 'DARK', 'CUSTOM');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThemeBasePreset') THEN
    CREATE TYPE "ThemeBasePreset" AS ENUM ('LIGHT', 'DARK');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntitySharePermission') THEN
    CREATE TYPE "EntitySharePermission" AS ENUM ('VIEW', 'EDIT', 'MANAGE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "username" TEXT NOT NULL,
  "email" TEXT,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "nationalId" TEXT NOT NULL,
  "birthDate" DATE NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrackingEntity" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrackingEntityItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entityId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "description" TEXT,
  "paymentReference" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEntityItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrackingEntityRecord" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId" TEXT NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "performedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEntityRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrackingEntityAllocation" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entityId" TEXT NOT NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "sourceLabel" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "performedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEntityAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrackingEntityShare" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "grantedById" TEXT NOT NULL,
  "permission" "EntitySharePermission" NOT NULL DEFAULT 'VIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEntityShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserSetting" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "themePreset" "ThemePreset" NOT NULL DEFAULT 'LIGHT',
  "customThemeBase" "ThemeBasePreset" NOT NULL DEFAULT 'LIGHT',
  "userIcon" TEXT NOT NULL DEFAULT 'user-round',
  "dashboardSurfaceColor" TEXT NOT NULL DEFAULT '#eadfce',
  "dashboardPanelColor" TEXT NOT NULL DEFAULT '#faf4eb',
  "dashboardPanelStrongColor" TEXT NOT NULL DEFAULT '#fffaf4',
  "dashboardInkColor" TEXT NOT NULL DEFAULT '#3e2c23',
  "dashboardMutedColor" TEXT NOT NULL DEFAULT '#7a6558',
  "dashboardLineColor" TEXT NOT NULL DEFAULT '#70543e',
  "dashboardBrandColor" TEXT NOT NULL DEFAULT '#6f4e37',
  "dashboardBrandSoftColor" TEXT NOT NULL DEFAULT '#ead7c3',
  "dashboardBrandDeepColor" TEXT NOT NULL DEFAULT '#4f3527',
  "dashboardSuccessColor" TEXT NOT NULL DEFAULT '#1f7a45',
  "dashboardDangerColor" TEXT NOT NULL DEFAULT '#a63f2e',
  "dashboardWarningColor" TEXT NOT NULL DEFAULT '#9a6a1f',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlatformSetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "platformName" TEXT NOT NULL DEFAULT 'Control Financiero',
  "platformLabel" TEXT NOT NULL DEFAULT 'Finance OS',
  "platformMotto" TEXT NOT NULL DEFAULT 'Entidades, servicios y pagos organizados',
  "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
  "currencyCode" TEXT NOT NULL DEFAULT 'COP',
  "supportEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoginHistory" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "usernameSnapshot" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "loggedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entityName" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "summary" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "performedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key"
  ON "User" ("username");

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
  ON "User" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "User_nationalId_key"
  ON "User" ("nationalId");

CREATE INDEX IF NOT EXISTS "User_role_status_idx"
  ON "User" ("role", "status");

CREATE INDEX IF NOT EXISTS "TrackingEntity_ownerId_createdAt_idx"
  ON "TrackingEntity" ("ownerId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TrackingEntity_ownerId_normalizedName_key"
  ON "TrackingEntity" ("ownerId", "normalizedName");

CREATE INDEX IF NOT EXISTS "TrackingEntityItem_entityId_createdAt_idx"
  ON "TrackingEntityItem" ("entityId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TrackingEntityItem_entityId_normalizedName_key"
  ON "TrackingEntityItem" ("entityId", "normalizedName");

CREATE INDEX IF NOT EXISTS "TrackingEntityRecord_itemId_occurredAt_idx"
  ON "TrackingEntityRecord" ("itemId", "occurredAt");

CREATE INDEX IF NOT EXISTS "TrackingEntityRecord_performedById_occurredAt_idx"
  ON "TrackingEntityRecord" ("performedById", "occurredAt");

CREATE INDEX IF NOT EXISTS "TrackingEntityAllocation_entityId_occurredAt_idx"
  ON "TrackingEntityAllocation" ("entityId", "occurredAt");

CREATE INDEX IF NOT EXISTS "TrackingEntityAllocation_performedById_occurredAt_idx"
  ON "TrackingEntityAllocation" ("performedById", "occurredAt");

CREATE INDEX IF NOT EXISTS "TrackingEntityShare_userId_createdAt_idx"
  ON "TrackingEntityShare" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "TrackingEntityShare_entityId_createdAt_idx"
  ON "TrackingEntityShare" ("entityId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TrackingEntityShare_entityId_userId_key"
  ON "TrackingEntityShare" ("entityId", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserSetting_userId_key"
  ON "UserSetting" ("userId");

CREATE INDEX IF NOT EXISTS "LoginHistory_userId_loggedInAt_idx"
  ON "LoginHistory" ("userId", "loggedInAt");

CREATE INDEX IF NOT EXISTS "AuditLog_entityName_entityId_createdAt_idx"
  ON "AuditLog" ("entityName", "entityId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntity_ownerId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntity"
      ADD CONSTRAINT "TrackingEntity_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityItem_entityId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityItem"
      ADD CONSTRAINT "TrackingEntityItem_entityId_fkey"
      FOREIGN KEY ("entityId") REFERENCES "TrackingEntity" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityItem_createdById_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityItem"
      ADD CONSTRAINT "TrackingEntityItem_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityRecord_itemId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityRecord"
      ADD CONSTRAINT "TrackingEntityRecord_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "TrackingEntityItem" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityRecord_performedById_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityRecord"
      ADD CONSTRAINT "TrackingEntityRecord_performedById_fkey"
      FOREIGN KEY ("performedById") REFERENCES "User" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityAllocation_entityId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityAllocation"
      ADD CONSTRAINT "TrackingEntityAllocation_entityId_fkey"
      FOREIGN KEY ("entityId") REFERENCES "TrackingEntity" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityAllocation_performedById_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityAllocation"
      ADD CONSTRAINT "TrackingEntityAllocation_performedById_fkey"
      FOREIGN KEY ("performedById") REFERENCES "User" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityShare_entityId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityShare"
      ADD CONSTRAINT "TrackingEntityShare_entityId_fkey"
      FOREIGN KEY ("entityId") REFERENCES "TrackingEntity" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityShare_userId_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityShare"
      ADD CONSTRAINT "TrackingEntityShare_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackingEntityShare_grantedById_fkey'
  ) THEN
    ALTER TABLE "TrackingEntityShare"
      ADD CONSTRAINT "TrackingEntityShare_grantedById_fkey"
      FOREIGN KEY ("grantedById") REFERENCES "User" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserSetting_userId_fkey'
  ) THEN
    ALTER TABLE "UserSetting"
      ADD CONSTRAINT "UserSetting_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LoginHistory_userId_fkey'
  ) THEN
    ALTER TABLE "LoginHistory"
      ADD CONSTRAINT "LoginHistory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuditLog_performedById_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_performedById_fkey"
      FOREIGN KEY ("performedById") REFERENCES "User" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "set_updated_at_User" ON "User";
CREATE TRIGGER "set_updated_at_User"
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_TrackingEntity" ON "TrackingEntity";
CREATE TRIGGER "set_updated_at_TrackingEntity"
BEFORE UPDATE ON "TrackingEntity"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_TrackingEntityItem" ON "TrackingEntityItem";
CREATE TRIGGER "set_updated_at_TrackingEntityItem"
BEFORE UPDATE ON "TrackingEntityItem"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_TrackingEntityRecord" ON "TrackingEntityRecord";
CREATE TRIGGER "set_updated_at_TrackingEntityRecord"
BEFORE UPDATE ON "TrackingEntityRecord"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_TrackingEntityAllocation" ON "TrackingEntityAllocation";
CREATE TRIGGER "set_updated_at_TrackingEntityAllocation"
BEFORE UPDATE ON "TrackingEntityAllocation"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_TrackingEntityShare" ON "TrackingEntityShare";
CREATE TRIGGER "set_updated_at_TrackingEntityShare"
BEFORE UPDATE ON "TrackingEntityShare"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_UserSetting" ON "UserSetting";
CREATE TRIGGER "set_updated_at_UserSetting"
BEFORE UPDATE ON "UserSetting"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_PlatformSetting" ON "PlatformSetting";
CREATE TRIGGER "set_updated_at_PlatformSetting"
BEFORE UPDATE ON "PlatformSetting"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO "PlatformSetting" (
  "id",
  "platformName",
  "platformLabel",
  "platformMotto",
  "timezone",
  "currencyCode"
)
VALUES (
  'default',
  'Control Financiero',
  'Finance OS',
  'Entidades, servicios y pagos organizados',
  'America/Bogota',
  'COP'
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
