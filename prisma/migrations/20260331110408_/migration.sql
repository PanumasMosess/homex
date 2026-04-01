-- AlterTable
ALTER TABLE `task` ADD COLUMN `aiDurationAssumptions` TEXT NULL,
    ADD COLUMN `aiLaborCost` DECIMAL(14, 2) NULL,
    ADD COLUMN `aiLaborPercent` INTEGER NULL DEFAULT 0,
    ADD COLUMN `aiMachineryCost` DECIMAL(14, 2) NULL,
    ADD COLUMN `aiMachineryPercent` INTEGER NULL DEFAULT 0,
    ADD COLUMN `aiMaterialCost` DECIMAL(14, 2) NULL,
    ADD COLUMN `aiMaterialPercent` INTEGER NULL DEFAULT 0,
    ADD COLUMN `aiMaterials` LONGTEXT NULL,
    ADD COLUMN `aiRisks` LONGTEXT NULL,
    ADD COLUMN `phase` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `procurement_suggestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialName` VARCHAR(191) NOT NULL,
    `specification` TEXT NULL,
    `quantity` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `unitPrice` DECIMAL(12, 2) NULL,
    `totalPrice` DECIMAL(12, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `taskId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `organizationId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `procurement_suggestion` ADD CONSTRAINT `procurement_suggestion_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_suggestion` ADD CONSTRAINT `procurement_suggestion_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_suggestion` ADD CONSTRAINT `procurement_suggestion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_suggestion` ADD CONSTRAINT `procurement_suggestion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
