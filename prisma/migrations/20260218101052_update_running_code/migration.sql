/*
  Warnings:

  - A unique constraint covering the columns `[projectCode]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `project` MODIFY `projectCode` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `projects_running` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `runningCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `organizationId` INTEGER NULL,

    UNIQUE INDEX `projects_running_runningCode_key`(`runningCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `project_projectCode_key` ON `project`(`projectCode`);

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_projectCode_fkey` FOREIGN KEY (`projectCode`) REFERENCES `projects_running`(`runningCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects_running` ADD CONSTRAINT `projects_running_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
