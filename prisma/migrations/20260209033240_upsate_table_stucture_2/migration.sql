-- DropForeignKey
ALTER TABLE `organization` DROP FOREIGN KEY `organization_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `user_positionId_fkey`;

-- DropIndex
DROP INDEX `organization_ownerId_fkey` ON `organization`;

-- DropIndex
DROP INDEX `user_positionId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `organization` MODIFY `ownerId` INTEGER NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `permission` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `position` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `project` ADD COLUMN `budget` DECIMAL(12, 2) NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `task` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `task_detail` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `positionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `organization` ADD CONSTRAINT `organization_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
