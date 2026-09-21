import { notifications } from "../data/prdbData";

export default function Notifications() {
  return (
    <div className="page">
      <div className="page-title"><span className="eyebrow">CENTER</span><h2>Notifikasi</h2><p>Perubahan dan aktivitas data yang perlu diperhatikan.</p></div>
      <div className="notification-list">
        {notifications.map(n => (
          <div className="notification-card" key={n.id}>
            <div className={`notification-icon ${n.type}`}>{n.type === "warning" ? "!" : n.type === "change" ? "↻" : "i"}</div>
            <div><strong>{n.title}</strong><p>{n.detail}</p><small>{n.time}</small></div>
            <button className="text-button">Buka →</button>
          </div>
        ))}
      </div>
    </div>
  );
}