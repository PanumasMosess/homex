-- RenameIndex
ALTER TABLE `task_actual_cost` DROP INDEX `task_actual_cost_taskId_fkey`;
ALTER TABLE `task_actual_cost` ADD INDEX `task_actual_cost_taskId_idx`(`taskId`);
