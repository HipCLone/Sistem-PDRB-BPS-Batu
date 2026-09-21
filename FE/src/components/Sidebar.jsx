export default function Sidebar({ active, onNavigate }) {
  const items = [
    ["dashboard", "⌂", "Dashboard"],
    ["data", "▦", "Data PDRB"],
    ["notifications", "◉", "Notifikasi"],
    ["profile", "○", "Profil Saya"]
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <strong>PDRB</strong>
          <span>Kota Batu</span>
        </div>
      </div>

      <div className="sidebar-section-title">MENU UTAMA</div>
      <nav>
        {items.map(([key, icon, label]) => (
          <button
            key={key}
            className={`nav-item ${active === key ? "active" : ""}`}
            onClick={() => onNavigate(key)}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
            {key === "notifications" && <span className="nav-count">3</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">?</div>
          <div>
            <strong>Butuh bantuan?</strong>
            <p>Hubungi admin pengelola data.</p>
          </div>
        </div>
        <button className="logout-button" onClick={() => onNavigate("login")}>
          ↪ <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}