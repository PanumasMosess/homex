-- RenameIndex
-- ALTER TABLE `task_actual_cost` RENAME INDEX `task_actual_cost_taskId_fkey` TO `task_actual_cost_taskId_idx`;
-- 1. ลบ Foreign Key Constraint ออกก่อน (ต้องลบตัวนี้ก่อนถึงจะลบ Index ได้)
ALTER TABLE `task_actual_cost` DROP FOREIGN KEY `task_actual_cost_taskId_fkey`;

-- 2. ลบ Index ตัวเดิมออก
ALTER TABLE `task_actual_cost` DROP INDEX `task_actual_cost_taskId_fkey`;

-- 3. สร้าง Index ตัวใหม่ตามที่ Prisma ต้องการ
ALTER TABLE `task_actual_cost` ADD INDEX `task_actual_cost_taskId_idx`(`taskId`);

-- 4. สร้าง Foreign Key กลับคืนมา โดยให้วิ่งไปหา Index ตัวใหม่
ALTER TABLE `task_actual_cost` ADD CONSTRAINT `task_actual_cost_taskId_fkey` 
FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;