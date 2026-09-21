import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import { periods, sampleTables } from "../data/prdbData";

function DatasetPreview({ dataset }) {
  const table = sampleTables[dataset.name];
  if (!table) {
    return (
      <div className="empty-preview">
        <div className="empty-icon">▦</div>
        <strong>Form dinamis siap digunakan</strong>
        <p>Struktur dataset ini akan mengikuti schema dari admin. Field yang kosong tetap ditampilkan dan tidak dianggap sebagai angka nol.</p>
      </div>
    );
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{table.columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {table.rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className={cell === "—" ? "empty-cell" : ""}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SectorDetail({ sector, onBack }) {
  const [activeInstitution, setActiveInstitution] = useState(0);
  const [activeDataset, setActiveDataset] = useState(0);
  const [period, setPeriod] = useState("2026 TW2");
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const institution = sector.institutions[activeInstitution];
  const dataset = institution?.datasets[activeDataset];

  const activeTable = useMemo(() => {
    if (!dataset) return null;
    return sampleTables[dataset.name] || null;
  }, [dataset]);

  const save = () => {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="page">
      <div className="breadcrumb"><button onClick={onBack}>Data PDRB</button><span>/</span><strong>{sector.code} — {sector.name}</strong></div>

      <div className="detail-hero">
        <div>
          <div className="code-pill">KODE {sector.code}</div>
          <h2>{sector.name}</h2>
          <p>{sector.institutions.length} instansi terhubung dengan struktur form dinamis.</p>
        </div>
        <StatusBadge status={sector.status} />
      </div>

      <div className="detail-layout">
        <aside className="dataset-sidebar">
          <div className="panel-label">INSTANSI / LEMBAGA</div>
          {sector.institutions.map((inst, idx) => (
            <button
              key={inst.name}
              className={`institution-item ${idx === activeInstitution ? "selected" : ""}`}
              onClick={() => { setActiveInstitution(idx); setActiveDataset(0); }}
            >
              <span className="folder-icon">▰</span>
              <span>{inst.name}</span>
            </button>
          ))}

          <div className="panel-label dataset-label">DATASET</div>
          {institution?.datasets.map((d, idx) => (
            <button
              key={d.name}
              className={`dataset-item ${idx === activeDataset ? "selected" : ""}`}
              onClick={() => setActiveDataset(idx)}
            >
              <span>{d.type === "calculated" ? "ƒx" : "▤"}</span>
              <span>{d.name}</span>
              <StatusBadge status={d.status} />
            </button>
          ))}
        </aside>

        <main className="form-panel">
          <div className="form-header">
            <div>
              <span className="eyebrow">FORM PENGISIAN DATA</span>
              <h3>{dataset?.name}</h3>
              <p>{institution?.name} • Data dapat kosong sesuai kondisi sumber.</p>
            </div>
            <div className="form-actions">
              <label className="period-select">Periode <select value={period} onChange={e => setPeriod(e.target.value)}>{periods.map(p => <option key={p}>{p}</option>)}</select></label>
              <button className="secondary-button" onClick={() => setEditMode(!editMode)}>{editMode ? "Batal Edit" : "Edit Data"}</button>
              {editMode && <button className="primary-button compact" onClick={save}>Simpan</button>}
            </div>
          </div>

          {saved && <div className="save-alert">✓ Perubahan data berhasil disimpan pada mode demo.</div>}

          <div className="data-meta">
            <div><span>Status</span><StatusBadge status={dataset?.status} /></div>
            <div><span>Format</span><strong>Desimal maksimal 2 digit</strong></div>
            <div><span>Threshold perubahan</span><strong>±100%</strong></div>
            <div><span>Data sumber</span><strong>{dataset?.type === "accounting" ? "LRA / APBD" : "Form dinamis"}</strong></div>
          </div>

          <DatasetPreview dataset={dataset} />

          {activeTable && editMode && (
            <div className="edit-note">
              <strong>Mode edit aktif</strong>
              <p>Prototype ini belum mengirim data ke backend. Pada implementasi berikutnya, setiap cell akan menjadi input sesuai tipe field/schema.</p>
            </div>
          )}

          <div className="phenomenon-card">
            <div>
              <span className="eyebrow">FENOMENA / PENJELASAN</span>
              <h4>Catatan perubahan periode</h4>
            </div>
            <textarea placeholder="Jelaskan alasan jika terjadi kenaikan/penurunan tajam. Field ini hanya muncul/diutamakan ketika perubahan mencapai threshold yang ditentukan." defaultValue="" />
            <div className="phenomenon-footer"><span>Patokan perubahan drastis: ±100%</span><button className="text-button">Lihat riwayat perubahan →</button></div>
          </div>
        </main>
      </div>
    </div>
  );
}