import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Filter, Inbox } from "lucide-react";
import { api } from "../services/api";
import { getShortEntityId } from "../utils/format";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string | null;
  read_at: string | null;
};

type NotificationResponse = {
  items: NotificationItem[];
  unread_count: number;
};

type ViewMode = "all" | "unread";

const entityTypeOptions = ["task", "project", "client"];

function formatDateTime(iso: string | null) {
  if (!iso) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function getNotificationHref(notification: NotificationItem): string | null {
  if (notification.entity_type === "task") return "/tasks";
  if (notification.entity_type === "project" && notification.entity_id) return `/projects/${notification.entity_id}`;
  if (notification.entity_type === "client" && notification.entity_id) return `/clients/${getShortEntityId(notification.entity_id)}`;
  return null;
}

function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    task_assigned: "Tarefa",
    task_comment: "Comentário",
    checklist_assigned: "Checklist",
  };
  return labels[type] || type.replaceAll("_", " ");
}

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [entityType, setEntityType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<NotificationResponse>("/notifications", {
        params: {
          unread_only: viewMode === "unread" || undefined,
          entity_type: entityType || undefined,
          limit: 100,
        },
      });
      setItems(response.data.items);
      setUnreadCount(response.data.unread_count);
    } catch {
      setError("Não foi possível carregar as notificações.");
    } finally {
      setIsLoading(false);
    }
  }, [entityType, viewMode]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => loadNotifications())
      .finally(() => {
        if (!isMounted) return;
      });

    return () => {
      isMounted = false;
    };
  }, [loadNotifications]);

  async function markOneRead(notificationId: string) {
    setIsSaving(true);
    try {
      const response = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
      setItems((current) => {
        if (viewMode === "unread") {
          return current.filter((item) => item.id !== notificationId);
        }
        return current.map((item) => item.id === notificationId ? response.data : item);
      });
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      setError("Não foi possível marcar a notificação como lida.");
    } finally {
      setIsSaving(false);
    }
  }

  async function markAllRead() {
    setIsSaving(true);
    try {
      await api.patch("/notifications/read-all");
      setItems((current) => {
        if (viewMode === "unread") {
          return [];
        }
        return current.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() }));
      });
      setUnreadCount(0);
    } catch {
      setError("Não foi possível marcar as notificações como lidas.");
    } finally {
      setIsSaving(false);
    }
  }

  const unreadItems = items.filter((item) => !item.is_read);
  const visibleEmptyCopy = viewMode === "unread"
    ? "Nenhuma notificação pendente."
    : "Nenhuma notificação registrada ainda.";

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Notificações</h1>
        <p>Eventos operacionais que pedem atenção ou acompanhamento.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="summary-cards">
        <div className={`summary-card ${unreadCount > 0 ? "summary-card-risk" : ""}`}>
          <Bell size={20} />
          <div>
            <strong>{unreadCount}</strong>
            <span>Não lidas</span>
          </div>
        </div>
        <div className="summary-card">
          <Inbox size={20} />
          <div>
            <strong>{items.length}</strong>
            <span>Na lista atual</span>
          </div>
        </div>
        <div className="summary-card">
          <CheckCheck size={20} />
          <div>
            <strong>{items.length - unreadItems.length}</strong>
            <span>Lidas</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="notification-toolbar">
          <div className="segmented-control" aria-label="Filtro de leitura">
            <button
              className={viewMode === "all" ? "segmented-active" : ""}
              type="button"
              onClick={() => setViewMode("all")}
            >
              Todas
            </button>
            <button
              className={viewMode === "unread" ? "segmented-active" : ""}
              type="button"
              onClick={() => setViewMode("unread")}
            >
              Não lidas
            </button>
          </div>

          <label className="notification-filter">
            <Filter size={14} />
            <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
              <option value="">Todas as entidades</option>
              {entityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <button
            className="ghost-action"
            type="button"
            disabled={isSaving || unreadCount === 0}
            onClick={markAllRead}
          >
            Marcar todas como lidas
          </button>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando notificações...</p>
        ) : items.length === 0 ? (
          <p className="empty-state">{visibleEmptyCopy}</p>
        ) : (
          <div className="notification-center-list">
            {items.map((notification) => {
              const href = getNotificationHref(notification);
              const content = (
                <>
                  <div className="notification-row-main">
                    <span className={`notification-dot ${notification.is_read ? "notification-dot-read" : ""}`} />
                    <div>
                      <div className="notification-row-title">
                        <strong>{notification.title}</strong>
                        <span className="meta-chip">{getNotificationTypeLabel(notification.type)}</span>
                      </div>
                      <p>{notification.body}</p>
                    </div>
                  </div>
                  <div className="notification-row-meta">
                    <time>{formatDateTime(notification.created_at)}</time>
                    {!notification.is_read && (
                      <button
                        className="notif-link-action"
                        type="button"
                        disabled={isSaving}
                        onClick={(event) => {
                          event.preventDefault();
                          markOneRead(notification.id);
                        }}
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </>
              );

              return (
                <article
                  className={`notification-center-item ${!notification.is_read ? "notification-center-item-unread" : ""}`}
                  key={notification.id}
                >
                  {href ? <Link to={href}>{content}</Link> : <div className="notification-static-row">{content}</div>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
