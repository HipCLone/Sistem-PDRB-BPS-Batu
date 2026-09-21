import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import SectorDetail from "./components/SectorDetail";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import { sectors } from "./data/prdbData";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [selectedSector, setSelectedSector] = useState(sectors[0]);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const openSector = (sector) => {
    setSelectedSector(sector);
    setPage("detail");
  };

  const titles = {
    dashboard: ["Dashboard", "Ringkasan pengumpulan data PDRB Kota Batu"],
    data: ["Data PDRB", "Pilih lapangan usaha dan dataset yang ingin dikelola"],
    notifications: ["Notifikasi", "Pembaruan data dari sistem"],
    profile: ["Profil Saya", "Informasi akun operator"],
    detail: ["Data PDRB", "Form pengisian dan riwayat data"]
  };

  const [title, subtitle] = titles[page] || titles.dashboard;

  return (
    <div className="app-shell">
      <Sidebar active={page === "detail" ? "data" : page} onNavigate={(next) => {
        if (next === "login") setLoggedIn(false);
        else if (next === "data") setPage("dashboard");
        else setPage(next);
      }} />
      <div className="main-shell">
        <Topbar title={title} subtitle={subtitle} onMenu={() => {}} />
        {page === "dashboard" && <Dashboard onOpenSector={openSector} />}
        {page === "data" && <Dashboard onOpenSector={openSector} />}
        {page === "detail" && <SectorDetail sector={selectedSector} onBack={() => setPage("dashboard")} />}
        {page === "notifications" && <Notifications />}
        {page === "profile" && (
          <div className="page">
            <div className="profile-card">
              <div className="avatar xl">DP</div>
              <div><span className="eyebrow">AKUN OPERATOR</span><h2>Dinas Pengguna</h2><p>operator@dinas.go.id</p></div>
              <StatusBadge status="Aktif" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}