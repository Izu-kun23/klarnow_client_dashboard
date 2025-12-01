-- CreateTable
CREATE TABLE `onboarding_answers` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `answers` JSON NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `onboarding_answers_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `plan` ENUM('LAUNCH', 'GROWTH') NOT NULL,
    `onboarding_answers_id` VARCHAR(191) NULL,
    `next_from_us` TEXT NULL,
    `next_from_you` TEXT NULL,
    `current_day_of_14` INTEGER NULL,
    `onboarding_percent` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clients_onboarding_answers_id_key`(`onboarding_answers_id`),
    INDEX `clients_user_id_idx`(`user_id`),
    INDEX `clients_email_idx`(`email`),
    INDEX `clients_plan_idx`(`plan`),
    UNIQUE INDEX `clients_user_id_plan_key`(`user_id`, `plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_phase_state` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `phase_id` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE') NOT NULL DEFAULT 'NOT_STARTED',
    `checklist` JSON NOT NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `client_phase_state_client_id_idx`(`client_id`),
    INDEX `client_phase_state_phase_id_idx`(`phase_id`),
    INDEX `client_phase_state_status_idx`(`status`),
    UNIQUE INDEX `client_phase_state_client_id_phase_id_key`(`client_id`, `phase_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `preferred_kit` ENUM('LAUNCH', 'GROWTH') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_submissions_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_onboarding_answers_id_fkey` FOREIGN KEY (`onboarding_answers_id`) REFERENCES `onboarding_answers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_phase_state` ADD CONSTRAINT `client_phase_state_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
