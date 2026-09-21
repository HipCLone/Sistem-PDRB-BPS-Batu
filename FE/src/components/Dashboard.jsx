import StatusBadge from "./StatusBadge";
import { sectors, summaryCards } from "../data/prdbData";

function getCounts(sector) {
  const datasets = sector.institutions.flatMap(i => i.datasets);
  return {
    total: datasets.length,
    done: datasets.filter(d => d.status === "Sudah").length,
    progress: datasets.filter(d => String(d.status).includes("Progress")).length
  };
}

export default function Dashboard({ onOpenSector }) {
  return (
    <div className="page">
      <div className="welcome">
        <div>
          <span className="eyebrow">DATA COLLECTION SYSTEM</span>
          <h2>Selamat datang di Portal PDRB</h2>
          <p>Kelola dan pantau pengumpulan data PDRB Kota Batu dari setiap instansi.</p>
        </div>
        <button className="primary-button" onClick={() => onOpenSector(sectors[0])}>Mulai mengisi data <span>→</span></button>
      </div>

      <div className="summary-grid">
        {summaryCards.map(card => (
          <div className="summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </div>
        ))}
      </div>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <h3>Daftar Lapangan Usaha</h3>
            <p>Status pengumpulan data berdasarkan master kebutuhan PDRB.</p>
          </div>
          <div className="search-box">⌕ <input placeholder="Cari kode atau lapangan usaha..." /></div>
        </div>

        <div className="sector-list">
          {sectors.map(sector => {
            const count = getCounts(sector);
            return (
              <button className="sector-row" key={sector.code} onClick={() => onOpenSector(sector)}>
                <div className="sector-code">{sector.code}</div>
                <div className="sector-main">
                  <strong>{sector.name}</strong>
                  <span>{sector.institutions.length} instansi • {count.total} dataset</span>
                </div>
                <div className="sector-progress">
                  <div className="mini-progress"><span style={{width: `${Math.round((count.done / Math.max(count.total, 1)) * 100)}%`}} /></div>
                  <small>{count.done}/{count.total} selesai</small>
                </div>
                <StatusBadge status={sector.status} />
                <span className="row-arrow">›</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}