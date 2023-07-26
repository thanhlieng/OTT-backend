/*
  Warnings:

  - Added the required column `room_id` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE `Room` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Room` ( id, created_at ) SELECT id, created_at FROM `Call`;

-- AlterTable
ALTER TABLE `Call` ADD COLUMN `ended_at` DATETIME(3) NULL,
    ADD COLUMN `room_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `started_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `StreamSession` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `call_id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `joined_at` DATETIME(3) NOT NULL,
    `leaved_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StreamSession_room_id_call_id_number_key`(`room_id`, `call_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;