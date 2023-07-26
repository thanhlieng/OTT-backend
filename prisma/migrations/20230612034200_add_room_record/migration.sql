-- AlterTable
ALTER TABLE `Room` ADD COLUMN `compose_job_id` VARCHAR(191) NULL,
    ADD COLUMN `compose_url` VARCHAR(191) NULL,
    ADD COLUMN `record_path` VARCHAR(191) NULL,
    ADD COLUMN `record_uri` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Call_created_at_idx` ON `Call`(`created_at`);
