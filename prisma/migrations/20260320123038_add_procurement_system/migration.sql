-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `contactPerson` VARCHAR(191) NULL,
    ADD COLUMN `taxId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `procurement_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialName` VARCHAR(191) NOT NULL,
    `specification` TEXT NULL,
    `partType` VARCHAR(191) NULL DEFAULT 'OTHER',
    `materialGroup` VARCHAR(191) NULL DEFAULT 'GENERAL',
    `unit` VARCHAR(191) NULL,
    `quantity` DECIMAL(12, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `expectedDate` DATETIME(3) NULL,
    `leadTimeDays` INTEGER NULL,
    `alertEnabled` BOOLEAN NOT NULL DEFAULT false,
    `alertDaysBefore` INTEGER NULL DEFAULT 3,
    `aiEstimateMin` DECIMAL(12, 2) NULL,
    `aiEstimateMid` DECIMAL(12, 2) NULL,
    `aiEstimateMax` DECIMAL(12, 2) NULL,
    `note` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_item_image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `procurementItemId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_supplier_quote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitPrice` DECIMAL(12, 2) NULL,
    `totalPrice` DECIMAL(12, 2) NULL,
    `quoteDate` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `note` TEXT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `isSelected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `procurementItemId` INTEGER NOT NULL,
    `supplierId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_task_link` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linkedBy` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `aiConfidence` DOUBLE NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `procurementItemId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `confirmedByUserId` INTEGER NULL,

    UNIQUE INDEX `procurement_task_link_procurementItemId_taskId_key`(`procurementItemId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `procurementItemId` INTEGER NOT NULL,
    `changedByUserId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `poNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `totalAmount` DECIMAL(14, 2) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `supplierId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,

    UNIQUE INDEX `purchase_order_poNumber_key`(`poNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` DECIMAL(12, 2) NULL,
    `unitPrice` DECIMAL(12, 2) NULL,
    `totalPrice` DECIMAL(14, 2) NULL,
    `purchaseOrderId` INTEGER NOT NULL,
    `procurementItemId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `organizationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `procurement_item` ADD CONSTRAINT `procurement_item_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_item` ADD CONSTRAINT `procurement_item_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_item` ADD CONSTRAINT `procurement_item_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_item_image` ADD CONSTRAINT `procurement_item_image_procurementItemId_fkey` FOREIGN KEY (`procurementItemId`) REFERENCES `procurement_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_supplier_quote` ADD CONSTRAINT `procurement_supplier_quote_procurementItemId_fkey` FOREIGN KEY (`procurementItemId`) REFERENCES `procurement_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_supplier_quote` ADD CONSTRAINT `procurement_supplier_quote_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_task_link` ADD CONSTRAINT `procurement_task_link_procurementItemId_fkey` FOREIGN KEY (`procurementItemId`) REFERENCES `procurement_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_task_link` ADD CONSTRAINT `procurement_task_link_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_task_link` ADD CONSTRAINT `procurement_task_link_confirmedByUserId_fkey` FOREIGN KEY (`confirmedByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_history` ADD CONSTRAINT `procurement_history_procurementItemId_fkey` FOREIGN KEY (`procurementItemId`) REFERENCES `procurement_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_history` ADD CONSTRAINT `procurement_history_changedByUserId_fkey` FOREIGN KEY (`changedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order` ADD CONSTRAINT `purchase_order_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order` ADD CONSTRAINT `purchase_order_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order` ADD CONSTRAINT `purchase_order_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order` ADD CONSTRAINT `purchase_order_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_item` ADD CONSTRAINT `purchase_order_item_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_item` ADD CONSTRAINT `purchase_order_item_procurementItemId_fkey` FOREIGN KEY (`procurementItemId`) REFERENCES `procurement_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
