import {
  NotificationType,
}from "../generated/prisma/enums.js";

import { prisma } from "../lib/prisma.js";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: link || null,
    },
  });
}

export async function createNotifications(
  notifications: CreateNotificationInput[]
) {
  if (notifications.length === 0) {
    return;
  }

  return prisma.notification.createMany({
    data: notifications.map(
      ({
        userId,
        type,
        title,
        message,
        link,
      }) => ({
        userId,
        type,
        title,
        message,
        link: link || null,
      })
    ),
  });
}

export async function notifyStaff(
  notification: Omit<
    CreateNotificationInput,
    "userId"
  >
) {
  const staffUsers =
    await prisma.user.findMany({
      where: {
        role: "STAFF",
        status: "ACTIVE",
      },

      select: {
        id: true,
      },
    });

  if (staffUsers.length === 0) {
    return;
  }

  return createNotifications(
    staffUsers.map((staff) => ({
      userId: staff.id,
      ...notification,
    }))
  );
}