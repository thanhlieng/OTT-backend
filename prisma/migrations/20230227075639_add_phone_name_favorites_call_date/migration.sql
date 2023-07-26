-- AlterTable
ALTER TABLE `Call` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `PhoneNumber` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `NumbersInFavorites` (
    `id` VARCHAR(191) NOT NULL,
    `number_id` VARCHAR(191) NOT NULL,
    `contact_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NumbersInFavorites` ADD CONSTRAINT `NumbersInFavorites_number_id_fkey` FOREIGN KEY (`number_id`) REFERENCES `PhoneNumber`(`number`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NumbersInFavorites` ADD CONSTRAINT `NumbersInFavorites_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `PhoneNumber`(`number`) ON DELETE RESTRICT ON UPDATE CASCADE;
