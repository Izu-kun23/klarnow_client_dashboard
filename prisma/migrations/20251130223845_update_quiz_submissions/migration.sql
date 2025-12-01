/*
  Warnings:

  - Added the required column `brand_name` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand_style` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logo_status` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `online_presence` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeline` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `quiz_submissions` ADD COLUMN `audience` JSON NOT NULL,
    ADD COLUMN `brand_goals` JSON NOT NULL,
    ADD COLUMN `brand_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `brand_style` VARCHAR(191) NOT NULL,
    ADD COLUMN `full_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `logo_status` VARCHAR(191) NOT NULL,
    ADD COLUMN `online_presence` VARCHAR(191) NOT NULL,
    ADD COLUMN `phone_number` VARCHAR(191) NULL,
    ADD COLUMN `timeline` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;
