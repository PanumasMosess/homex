-- AlterTable
ALTER TABLE `project` ADD COLUMN `parentProjectId` INTEGER NULL,
    ADD COLUMN `phaseNumber` INTEGER NULL,
    ADD COLUMN `rootProjectId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_parentProjectId_fkey` FOREIGN KEY (`parentProjectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
