-- AlterTable
ALTER TABLE "NotificationDelivery" ADD COLUMN     "emailHtml" TEXT,
ADD COLUMN     "emailSubject" TEXT,
ADD COLUMN     "emailText" TEXT,
ADD COLUMN     "emailTo" TEXT;
