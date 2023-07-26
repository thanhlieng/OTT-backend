-- CreateTable
CREATE TABLE `CallActionLogs` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `call_id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `error` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `network` VARCHAR(191) NULL,
    `os_name` VARCHAR(191) NULL,
    `os_version` VARCHAR(191) NULL,

    INDEX `CallActionLogs_room_id_call_id_number_idx`(`room_id`, `call_id`, `number`),
    INDEX `CallActionLogs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
