export function formatDate(value?: string | null, fallback = "não informado") {
  if (!value) return fallback;

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

export function formatDateTime(value?: string | null, fallback = "agora") {
  if (!value) return fallback;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";

  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));

  if (mins < 60) return `${mins}m atrás`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function formatOverdueAge(iso: string | null): string {
  if (!iso) return "—";

  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(diff / 86400000));

  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  if (days < 7) return `${days} dias`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 semana" : `${weeks} semanas`;
}

export function getShortEntityId(id: string): string {
  return id.slice(0, 8);
}
