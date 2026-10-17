import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";

function NotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState(null);

  const containerRef = useRef(null);

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications");

      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    // Actualizamos periódicamente sin necesidad
    // de WebSockets por ahora.
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleNotificationClick(notification) {
    try {
      if (!notification.read) {
        await api.patch(
          `/notifications/${notification.id}/read`
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read: true }
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }

      setOpen(false);

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Error marking notifications as read:",
        error
      );
    }
  }

  async function dismissNotification(event, notification) {
    // Evita que al pulsar la X también se abra
    // la notificación.
    event.stopPropagation();

    try {
      setDismissingId(notification.id);

      await api.patch(
        `/notifications/${notification.id}/dismiss`
      );

      setNotifications((current) =>
        current.filter(
          (item) => item.id !== notification.id
        )
      );

      if (!notification.read) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }
    } catch (error) {
      console.error(
        "Error dismissing notification:",
        error
      );
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-black/[0.04]"
        aria-label="Notificaciones"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-[18px] w-[18px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022 23.848 23.848 0 0 0 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#8A6340] px-1 text-[9px] font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/10 bg-[#F4EDE2] shadow-xl">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-black/40">
                Actividad
              </p>

              <h3 className="mt-1 text-base font-medium">
                Notificaciones
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[9px] uppercase tracking-[0.12em] text-black/45 transition-opacity hover:opacity-60"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-xs text-black/40">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-black/40">
                  No tienes notificaciones.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative border-b border-black/[0.07] last:border-b-0 ${
                    !notification.read
                      ? "bg-[#8A6340]/[0.07]"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                    className="block w-full px-5 py-4 pr-12 text-left transition-colors hover:bg-black/[0.03]"
                  >
                    <div className="flex gap-3">
                      <div className="pt-1.5">
                        <span
                          className={`block h-2 w-2 rounded-full ${
                            notification.read
                              ? "bg-black/15"
                              : "bg-[#8A6340]"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-black/50">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-black/30">
                          {formatNotificationDate(
                            notification.createdAt
                          )}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(event) =>
                      dismissNotification(
                        event,
                        notification
                      )
                    }
                    disabled={
                      dismissingId === notification.id
                    }
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-base font-light text-black/30 transition hover:bg-black/[0.06] hover:text-black/70 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Quitar notificación"
                    title="Quitar notificación"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(date) {
  if (!date) {
    return "";
  }

  const value = new Date(date);
  const now = new Date();

  const difference =
    now.getTime() - value.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "Ahora";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Hace ${days} d`;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(value);
}

export default NotificationBell;