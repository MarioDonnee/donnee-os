export function getDueStatusLabel(dueStatus?: string | null) {
  if (dueStatus === "OVERDUE") return "Atrasada";
  if (dueStatus === "DUE_TODAY") return "Hoje";
  if (dueStatus === "DUE_SOON") return "Em breve";
  if (dueStatus === "COMPLETED") return "Concluída";
  if (dueStatus === "NO_DATE") return "Sem prazo";
  return "No prazo";
}

export function getDueStatusClass(dueStatus?: string | null) {
  if (dueStatus === "OVERDUE") return "due-chip-late";
  if (dueStatus === "DUE_TODAY") return "due-chip-today";
  if (dueStatus === "DUE_SOON") return "due-chip-soon";
  if (dueStatus === "COMPLETED") return "due-chip-done";
  if (dueStatus === "NO_DATE") return "due-chip-muted";
  return "";
}

export function getRiskStatusLabel(riskStatus?: string | null) {
  if (riskStatus === "CRITICAL") return "Crítico";
  if (riskStatus === "AT_RISK") return "Em risco";
  if (riskStatus === "ATTENTION") return "Atenção";
  return "Saudável";
}

export function getRiskStatusClass(riskStatus?: string | null) {
  if (riskStatus === "CRITICAL") return "risk-critical";
  if (riskStatus === "AT_RISK") return "risk-at-risk";
  if (riskStatus === "ATTENTION") return "risk-attention";
  return "risk-healthy";
}
