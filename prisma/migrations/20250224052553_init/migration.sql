-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "DateSelection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "selectionType" TEXT NOT NULL,
    "sun" BOOLEAN NOT NULL DEFAULT false,
    "mon" BOOLEAN NOT NULL DEFAULT false,
    "tue" BOOLEAN NOT NULL DEFAULT false,
    "wed" BOOLEAN NOT NULL DEFAULT false,
    "thu" BOOLEAN NOT NULL DEFAULT false,
    "fri" BOOLEAN NOT NULL DEFAULT false,
    "sat" BOOLEAN NOT NULL DEFAULT false,
    "specifyDates" TEXT,
    "dateRangeStart" TEXT,
    "dateRangeEnd" TEXT,
    "relationSettingId" TEXT NOT NULL,
    CONSTRAINT "DateSelection_relationSettingId_fkey" FOREIGN KEY ("relationSettingId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DateSelection_relationSettingId_key" ON "DateSelection"("relationSettingId");
