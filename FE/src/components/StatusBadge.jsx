export default function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  let tone = "neutral";
  if (normalized === "sudah") tone = "success";
  else if (normalized === "belum") tone = "danger";
  else if (normalized.includes("progress")) tone = "warning";
  else if (normalized.includes("derived")) tone = "info";

  return <span className={`status-badge ${tone}`}><span className="status-dot" />{status}</span>;
}