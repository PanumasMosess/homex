-- CreateTable
CREATE TABLE `task_dependency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `dependsOnId` INTEGER NOT NULL,

    UNIQUE INDEX `task_dependency_taskId_dependsOnId_key`(`taskId`, `dependsOnId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_dependency` ADD CONSTRAINT `task_dependency_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependency` ADD CONSTRAINT `task_dependency_dependsOnId_fkey` FOREIGN KEY (`dependsOnId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
