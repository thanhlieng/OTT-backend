-- AlterTable
ALTER TABLE `PhoneNumber` ADD COLUMN `alias_for_number` VARCHAR(191) NULL,
    ADD COLUMN `sip_in` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sip_out` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Call_room_id_idx` ON `Call`(`room_id`);

-- CreateIndex
CREATE INDEX `PhoneNumber_alias_for_number_idx` ON `PhoneNumber`(`alias_for_number`);

-- CreateIndex
CREATE INDEX `PhoneNumbersOnGroups_number_id_idx` ON `PhoneNumbersOnGroups`(`number_id`);

-- CreateIndex
CREATE INDEX `StreamSession_room_id_idx` ON `StreamSession`(`room_id`);

-- CreateIndex
CREATE INDEX `StreamSession_call_id_idx` ON `StreamSession`(`call_id`);

-- RenameIndex
ALTER TABLE `Account` RENAME INDEX `Account_userId_fkey` TO `Account_userId_idx`;

-- RenameIndex
ALTER TABLE `Call` RENAME INDEX `Call_from_number_fkey` TO `Call_from_number_idx`;

-- RenameIndex
ALTER TABLE `Call` RENAME INDEX `Call_to_number_fkey` TO `Call_to_number_idx`;

-- RenameIndex
ALTER TABLE `NumbersInFavorites` RENAME INDEX `NumbersInFavorites_contact_id_fkey` TO `NumbersInFavorites_contact_id_idx`;

-- RenameIndex
ALTER TABLE `NumbersInFavorites` RENAME INDEX `NumbersInFavorites_number_id_fkey` TO `NumbersInFavorites_number_id_idx`;

-- RenameIndex
ALTER TABLE `PhoneNumbersOnGroups` RENAME INDEX `PhoneNumbersOnGroups_group_id_fkey` TO `PhoneNumbersOnGroups_group_id_idx`;

-- RenameIndex
ALTER TABLE `PushToken` RENAME INDEX `PushToken_number_id_fkey` TO `PushToken_number_id_idx`;

-- RenameIndex
ALTER TABLE `Session` RENAME INDEX `Session_userId_fkey` TO `Session_userId_idx`;
