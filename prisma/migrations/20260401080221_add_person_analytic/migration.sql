-- CreateTable
CREATE TABLE `camera_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cameraId` INTEGER NOT NULL,
    `personCount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `camera_analytics` ADD CONSTRAINT `camera_analytics_cameraId_fkey` FOREIGN KEY (`cameraId`) REFERENCES `camera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
