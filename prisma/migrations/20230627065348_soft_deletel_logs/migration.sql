-- AlterTable
ALTER TABLE `Call` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `CallActionLogs` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Room` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `StreamSession` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;
