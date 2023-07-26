-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Call` DROP FOREIGN KEY `Call_from_number_fkey`;

-- DropForeignKey
ALTER TABLE `Call` DROP FOREIGN KEY `Call_to_number_fkey`;

-- DropForeignKey
ALTER TABLE `NumbersInFavorites` DROP FOREIGN KEY `NumbersInFavorites_contact_id_fkey`;

-- DropForeignKey
ALTER TABLE `NumbersInFavorites` DROP FOREIGN KEY `NumbersInFavorites_number_id_fkey`;

-- DropForeignKey
ALTER TABLE `PhoneNumbersOnGroups` DROP FOREIGN KEY `PhoneNumbersOnGroups_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `PhoneNumbersOnGroups` DROP FOREIGN KEY `PhoneNumbersOnGroups_number_id_fkey`;

-- DropForeignKey
ALTER TABLE `PushToken` DROP FOREIGN KEY `PushToken_number_id_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;
