/*
  Migración de arquitectura de acceso de marcas.

  Convierte la antigua relación:
    Brand.userId -> User

  en:
    Brand -> BrandMember -> User

  preservando los usuarios ya asociados a marcas.
*/

-- CreateEnum
CREATE TYPE "BrandAccessMode" AS ENUM (
    'MANAGED',
    'PORTAL',
    'SELF_MANAGED'
);

-- CreateEnum
CREATE TYPE "BrandMemberRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'MARKETING',
    'VIEWER'
);

-- -----------------------------------------------------
-- 1. Añadir modo de acceso a Brand
-- -----------------------------------------------------

ALTER TABLE "Brand"
ADD COLUMN "accessMode" "BrandAccessMode"
NOT NULL DEFAULT 'MANAGED';


-- -----------------------------------------------------
-- 2. Crear BrandMember
-- -----------------------------------------------------

CREATE TABLE "BrandMember" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    "role" "BrandMemberRole"
        NOT NULL DEFAULT 'VIEWER',

    "canViewCampaigns" BOOLEAN
        NOT NULL DEFAULT true,

    "canCreateCampaigns" BOOLEAN
        NOT NULL DEFAULT false,

    "canEditCampaigns" BOOLEAN
        NOT NULL DEFAULT false,

    "canViewProposals" BOOLEAN
        NOT NULL DEFAULT true,

    "canApproveCreators" BOOLEAN
        NOT NULL DEFAULT false,

    "canViewDeliverables" BOOLEAN
        NOT NULL DEFAULT true,

    "canApproveContent" BOOLEAN
        NOT NULL DEFAULT false,

    "canViewResults" BOOLEAN
        NOT NULL DEFAULT true,

    "canExportReports" BOOLEAN
        NOT NULL DEFAULT false,

    "canDiscoverCreators" BOOLEAN
        NOT NULL DEFAULT false,

    "canContactCreators" BOOLEAN
        NOT NULL DEFAULT false,

    "canSelectCreators" BOOLEAN
        NOT NULL DEFAULT false,

    "createdAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updatedAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandMember_pkey"
        PRIMARY KEY ("id")
);


-- -----------------------------------------------------
-- 3. IMPORTANTE:
-- Copiar las relaciones actuales ANTES de borrar userId
-- -----------------------------------------------------

INSERT INTO "BrandMember" (
    "id",
    "brandId",
    "userId",
    "role",
    "canViewCampaigns",
    "canCreateCampaigns",
    "canEditCampaigns",
    "canViewProposals",
    "canApproveCreators",
    "canViewDeliverables",
    "canApproveContent",
    "canViewResults",
    "canExportReports",
    "canDiscoverCreators",
    "canContactCreators",
    "canSelectCreators",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "userId",
    'OWNER'::"BrandMemberRole",

    true,
    false,
    false,

    true,
    false,

    true,
    false,

    true,
    false,

    false,
    false,
    false,

    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP

FROM "Brand"
WHERE "userId" IS NOT NULL;


-- -----------------------------------------------------
-- 4. Crear índices de BrandMember
-- -----------------------------------------------------

CREATE INDEX "BrandMember_brandId_idx"
ON "BrandMember"("brandId");

CREATE INDEX "BrandMember_userId_idx"
ON "BrandMember"("userId");

CREATE UNIQUE INDEX "BrandMember_brandId_userId_key"
ON "BrandMember"("brandId", "userId");


-- -----------------------------------------------------
-- 5. Crear índice del modo de acceso
-- -----------------------------------------------------

CREATE INDEX "Brand_accessMode_idx"
ON "Brand"("accessMode");


-- -----------------------------------------------------
-- 6. Crear relaciones de BrandMember
-- -----------------------------------------------------

ALTER TABLE "BrandMember"
ADD CONSTRAINT "BrandMember_brandId_fkey"
FOREIGN KEY ("brandId")
REFERENCES "Brand"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "BrandMember"
ADD CONSTRAINT "BrandMember_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- -----------------------------------------------------
-- 7. Ya hemos preservado los datos.
-- Ahora sí podemos eliminar la relación antigua.
-- -----------------------------------------------------

ALTER TABLE "Brand"
DROP CONSTRAINT "Brand_userId_fkey";

DROP INDEX "Brand_userId_key";

ALTER TABLE "Brand"
DROP COLUMN "userId";