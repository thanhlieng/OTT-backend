-- AlterTable
ALTER TABLE `Call` ADD COLUMN `feedback` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Group` ADD COLUMN `after_call_feedback` VARCHAR(191) NULL;
