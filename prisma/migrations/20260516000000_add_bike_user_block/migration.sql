-- CreateTable
CREATE TABLE `bike_user_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `bikeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    UNIQUE INDEX `bike_user_blocks_bikeId_userId_key`(`bikeId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bike_user_blocks` ADD CONSTRAINT `bike_user_blocks_bikeId_fkey` FOREIGN KEY (`bikeId`) REFERENCES `bikes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_user_blocks` ADD CONSTRAINT `bike_user_blocks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
