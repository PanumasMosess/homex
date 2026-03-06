/*
  Warnings:

  - A unique constraint covering the columns `[positionId,permissionId]` on the table `position_permission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `position_permission_positionId_permissionId_key` ON `position_permission`(`positionId`, `permissionId`);
