-- CreateTable
-- CreateTable
CREATE TABLE `AdminsOnGroups` (
    `user_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assigned_by` VARCHAR(191) NOT NULL,

    INDEX `AdminsOnGroups_group_id_idx`(`group_id`),
    INDEX `AdminsOnGroups_user_id_idx`(`user_id`),
    PRIMARY KEY (`user_id`, `group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

