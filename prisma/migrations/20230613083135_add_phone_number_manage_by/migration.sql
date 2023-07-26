-- AlterTable
ALTER TABLE `PhoneNumber` ADD COLUMN `manage_by_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `PhoneNumber_manage_by_id_idx` ON `PhoneNumber`(`manage_by_id`);
