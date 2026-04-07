-- DropForeignKey
ALTER TABLE `task_actual_cost` DROP FOREIGN KEY `task_actual_cost_taskId_fkey`;

-- AddForeignKey
ALTER TABLE `task_actual_cost` ADD CONSTRAINT `task_actual_cost_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
