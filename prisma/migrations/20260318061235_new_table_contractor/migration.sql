-- CreateTable
CREATE TABLE `contractor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractorName` VARCHAR(191) NOT NULL,
    `contractorPhone` VARCHAR(191) NULL,
    `contractorEmail` VARCHAR(191) NULL,
    `contractorAddress` VARCHAR(191) NULL,
    `contractorDesc` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `organizationId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_contractor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `organizationId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `contractorId` INTEGER NOT NULL,

    UNIQUE INDEX `task_contractor_taskId_contractorId_key`(`taskId`, `contractorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contractor` ADD CONSTRAINT `contractor_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_contractor` ADD CONSTRAINT `task_contractor_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_contractor` ADD CONSTRAINT `task_contractor_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_contractor` ADD CONSTRAINT `task_contractor_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `contractor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
