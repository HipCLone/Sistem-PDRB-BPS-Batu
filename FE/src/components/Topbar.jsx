export default function Topbar({ title, subtitle, onMenu }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}>☰</button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" title="Notifikasi">♢<span className="notification-dot" /></button>
        <div className="user-chip">
          <div className="avatar">DP</div>
          <div>
            <strong>Dinas Pengguna</strong>
            <span>Operator</span>
          </div>
          <span>⌄</span>
        </div>
      </div>
    </header>
  );
}