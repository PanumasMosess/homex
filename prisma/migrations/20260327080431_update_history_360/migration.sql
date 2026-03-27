/*
  Warnings:

  - You are about to drop the column `thumbnail` on the `point360` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `point360` DROP COLUMN `thumbnail`;

-- CreateTable
CREATE TABLE `Point360History` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `pointId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Point360History` ADD CONSTRAINT `Point360History_pointId_fkey` FOREIGN KEY (`pointId`) REFERENCES `Point360`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
