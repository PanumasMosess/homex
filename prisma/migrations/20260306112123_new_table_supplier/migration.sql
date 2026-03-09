-- CreateTable
CREATE TABLE `supplier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplierName` VARCHAR(191) NOT NULL,
    `supplierPhone` VARCHAR(191) NULL,
    `supplierEmail` VARCHAR(191) NULL,
    `supplierAddress` VARCHAR(191) NULL,
    `supplierDesc` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `supplier` ADD CONSTRAINT `supplier_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
