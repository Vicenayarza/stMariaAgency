
import {
  recoverStuckNotificationEmails,
  retryFailedNotificationEmails,
} from "../services/notification-retry.service.js";

const WORKER_INTERVAL_MS = 5 * 60 * 1000;

let isRunning = false;

export async function runNotificationWorker() {
  if (isRunning) {
    console.log(
      "[NotificationWorker] Ya hay una ejecución activa."
    );
    return;
  }

  isRunning = true;

  try {
    console.log(
      "[NotificationWorker] Iniciando procesamiento..."
    );

    const recovered =
      await recoverStuckNotificationEmails();

    const results =
      await retryFailedNotificationEmails(20);

    console.log("[NotificationWorker] Resultado:", {
      recovered,
      ...results,
    });
  } catch (error) {
    console.error(
      "[NotificationWorker] Error:",
      error
    );
  } finally {
    isRunning = false;
  }
}

export function startNotificationWorker() {
  console.log(
    "[NotificationWorker] Iniciado."
  );

  // Primera ejecución.
  void runNotificationWorker();

  // Ejecuciones posteriores.
  const interval = setInterval(() => {
    void runNotificationWorker();
  }, WORKER_INTERVAL_MS);

  interval.unref();

  return interval;
}
