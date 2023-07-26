-- AlterTable
ALTER TABLE `StreamSession` ADD COLUMN `connect_ms` INTEGER NULL,
    ADD COLUMN `ip` VARCHAR(191) NULL,
    ADD COLUMN `user_agent` VARCHAR(191) NULL,
    ADD COLUMN `zone_lat` DOUBLE NULL,
    ADD COLUMN `zone_lon` DOUBLE NULL;
