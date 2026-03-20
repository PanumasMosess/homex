-- AlterTable
ALTER TABLE `task` ADD COLUMN `estimatedBudget` DECIMAL(12, 2) NULL,
    ADD COLUMN `estimatedDurationDays` INTEGER NULL,
    ADD COLUMN `startAiPlanned` DATETIME(3) NULL;
