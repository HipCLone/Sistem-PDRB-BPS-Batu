import { useEffect, useId, useRef, useState } from 'react';
import { parseValue, displayCell } from '../lib/format';

function Dialog({title,description,onClose,busy,children,initialFocus}){
  const ref=useRef(null),id=useId();
  useEffect(()=>{const previous=document.activeElement;ref.current.showModal();if(initialFocus)ref.current.querySelector(initialFocus)?.focus();return()=>{previous?.focus();};},[]);
  return <dialog ref={ref} className="dialog" aria-labelledby={id} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();if(!busy)onClose();}}} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="modal"><div className="modal-heading"><h2 id={id}>{title}</h2><button className="text-btn" type="button" disabled={busy} onClick={onClose}>Tutup</button></div><p>{description}</p>{children}</div></dialog>;
}
function useSubmit(action){const [busy,setBusy]=useState(false),[error,setError]=useState('');return {busy,error,run:async(...args)=>{if(busy)return;setBusy(true);setError('');try{await action(...args);}catch(e){setError(e.message);}finally{setBusy(false);}}};}

export function DrasticChangeModal({change,onClose,onSubmit}){
  const [reason,setReason]=useState(''),{busy,error,run}=useSubmit(onSubmit);
  const number=value=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:6}).format(value);
  return <Dialog title="Jelaskan perubahan drastis" description="Nilai belum disimpan. Kenaikan minimal dua kali lipat atau penurunan minimal 50% dari periode sebelumnya memerlukan alasan untuk admin." busy={busy} onClose={onClose} initialFocus="textarea">
    <p><strong>{change.table}</strong><br/>{change.indicator}</p>
    <dl className="change-comparison"><div><dt>Periode sebelumnya: {change.previous.period}</dt><dd>{number(change.previous.value)}</dd></div><div><dt>Nilai yang akan disimpan: {change.currentPeriod}</dt><dd>{number(change.currentValue)}</dd></div><div><dt>{change.direction==='increase'?'Kenaikan':'Penurunan'}</dt><dd>{number(Math.abs(change.percentage))}%</dd></div></dl>
    <form onSubmit={e=>{e.preventDefault();run(reason.trim());}}>
      <label>Alasan {change.direction==='increase'?'kenaikan':'penurunan'}<textarea required maxLength={2000} rows={4} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}/></label>
      <p className="field-help">Alasan tersimpan dalam log histori dan notifikasi admin. Maksimal 2.000 karakter.</p>
      {error&&<p className="error-box" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="primary-btn" disabled={busy||!reason.trim()}>{busy?'Menyimpan...':'Simpan nilai dan alasan'}</button></div>
    </form>
  </Dialog>;
}

export function RowModal({sheet,block,onClose,onSubmit}){
  const [values,setValues]=useState(()=>Array(sheet.maxCol).fill('')),[before,setBefore]=useState('end'),{busy,error,run}=useSubmit(onSubmit);
  const filled=values.some(v=>v.trim());
  const descriptorColumns=block.schemaColumns.filter((c,i)=>!/(?:20\d{2}|triwulan|\btw\b)/i.test(block.schemaLabels[i]));
  return <Dialog title="Tambah baris" description={`Tabel tujuan: ${block.label}. Isi nama komoditas atau indikator. Satuan dan keterangan boleh dikosongkan; nilai periode diisi setelah baris dibuat.`} onClose={onClose} busy={busy}><form onSubmit={e=>{e.preventDefault();run(values.map(parseValue),before==='end'?null:Number(before));}}><fieldset disabled={busy} className="dynamic-form single"><label>Posisi baris<select value={before} onChange={e=>setBefore(e.target.value)}><option value="end">Di akhir tabel</option>{block.editableRowIndexes.map(r=><option key={r} value={r}>Sebelum {descriptorColumns.map(c=>displayCell(sheet.rows[r]?.[c])).filter(v=>v&&v!=='-').join(' · ')||'baris kosong'} (baris {r+1})</option>)}</select></label>{descriptorColumns.map(c=><label key={c}>{block.schemaLabels[block.schemaColumns.indexOf(c)]}<input value={values[c]||''} onChange={e=>setValues(current=>current.map((v,index)=>index===c?e.target.value:v))}/></label>)}</fieldset>{error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-btn" onClick={onClose} disabled={busy}>Batal</button><button className="primary-btn" disabled={busy||!filled}>{busy?'Menyimpan...':'Simpan baris'}</button></div></form></Dialog>;
}
export function ColumnModal({block,onClose,onSubmit}){
  const [label,setLabel]=useState(''),{busy,error,run}=useSubmit(onSubmit);
  return <Dialog title="Tambah kolom" description={`Tabel tujuan: ${block.label}`} onClose={onClose} busy={busy}><form onSubmit={e=>{e.preventDefault();run(label.trim());}}><label>Nama kolom<input autoFocus required maxLength={200} disabled={busy} value={label} onChange={e=>setLabel(e.target.value)}/></label>{error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="primary-btn" disabled={busy||!label.trim()}>{busy?'Menyimpan...':'Simpan kolom'}</button></div></form></Dialog>;
}
export function UploadModal({institution,institutions,onClose,onUpload}){
  const [target,setTarget]=useState(institution||''),[title,setTitle]=useState(''),[file,setFile]=useState(null),[year,setYear]=useState(String(new Date().getFullYear())),[quarter,setQuarter]=useState(''),{busy,error,run}=useSubmit(onUpload);
  return <Dialog title="Upload berkas pelaporan" description="Setiap upload menjadi data baru, tidak menggantikan data sebelumnya. Struktur tabel boleh berbeda sesuai template pelaporan. Format Excel atau CSV, maksimal 25 MB." onClose={onClose} busy={busy}><form onSubmit={e=>{e.preventDefault();run(file,target,title.trim(),year,quarter);}}>
    {institutions?<label>Instansi tujuan<select required disabled={busy} value={target} onChange={e=>setTarget(e.target.value)}><option value="">Pilih instansi</option>{institutions.map(name=><option key={name}>{name}</option>)}</select></label>:<p>Instansi tujuan: <strong>{target}</strong></p>}
    <label>Judul data (opsional)<input disabled={busy} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} aria-describedby="upload-title-help"/></label><p className="field-help" id="upload-title-help">Jika dikosongkan, judul mengikuti tabel sumber. Nama file tidak ditampilkan pada daftar data.</p>
    <label className="upload-field">Berkas Excel/CSV<input required type="file" disabled={busy} accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
    <fieldset disabled={busy} className="dynamic-form"><label>Tahun pelaporan<input name="year" required type="number" min="2000" max="2099" value={year} onChange={e=>setYear(e.target.value)}/></label><label>Triwulan pelaporan<select name="quarter" required value={quarter} onChange={e=>setQuarter(e.target.value)}><option value="">Pilih triwulan</option>{[1,2,3,4].map(q=><option key={q} value={q}>Triwulan {q}</option>)}</select></label></fieldset><p className="field-help">Periode membantu mengenali isi laporan yang diunggah. Status mengikuti nilai yang tersedia pada data.</p>
    {error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="primary-btn" disabled={busy||!file||!target}>{busy?'Mengunggah...':'Upload berkas'}</button></div>
  </form></Dialog>;
}

export function TemplateModal({institutions,institution='',onClose,onSubmit}){
  const [title,setTitle]=useState(''),[target,setTarget]=useState(institution),[label,setLabel]=useState(''),[columns,setColumns]=useState(''),[rowLabels,setRowLabels]=useState('');
  const {busy,error,run}=useSubmit(onSubmit),lines=value=>value.split('\n').map(s=>s.trim()).filter(Boolean);
  return <Dialog title={institutions?'Buat data pelaporan':'Tambah tabel'} description="Tentukan struktur tabel untuk diisi instansi. Tulis satu nama per baris pada daftar kolom dan indikator. Kolom pertama memuat indikator baris, kolom lainnya dibiarkan kosong." busy={busy} onClose={onClose}>
    <form onSubmit={e=>{e.preventDefault();run({title:title.trim(),institution:target,table:{label:label.trim(),columns:lines(columns),rowLabels:lines(rowLabels)}});}}><fieldset disabled={busy} className="dynamic-form single">
      {institutions&&<><label>Judul data<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Instansi tujuan<select required value={target} onChange={e=>setTarget(e.target.value)}><option value="">Pilih instansi</option>{institutions.map(name=><option key={name}>{name}</option>)}</select></label></>}
      <label>Nama tabel<input required maxLength={160} value={label} onChange={e=>setLabel(e.target.value)}/></label>
      <label>Nama kolom (minimal dua)<textarea required rows={4} maxLength={20000} value={columns} onChange={e=>setColumns(e.target.value)} placeholder={'Indikator\n2026 Triwulan III'}/></label>
      <label>Indikator baris (minimal satu)<textarea required rows={4} maxLength={200000} value={rowLabels} onChange={e=>setRowLabels(e.target.value)}/></label>
    </fieldset>{error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="primary-btn" disabled={busy}>{busy?'Menyimpan...':institutions?'Simpan data':'Simpan tabel'}</button></div></form>
  </Dialog>;
}

export function DatasetManageModal({data,onClose,onSubmit,onDelete}){
  const [title,setTitle]=useState(data.title),[institution,setInstitution]=useState(data.institution),{busy,error,run}=useSubmit(onSubmit);
  return <Dialog title="Kelola data pelaporan" description="Ubah judul atau instansi pemilik dataset. Pemindahan instansi juga memindahkan hak akses datanya." busy={busy} onClose={onClose}><form onSubmit={e=>{e.preventDefault();run({title:title.trim(),institution});}}>
    <fieldset disabled={busy} className="dynamic-form single"><label>Judul data<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Instansi pemilik<select value={institution} onChange={e=>setInstitution(e.target.value)}>{data.institutions.map(name=><option key={name}>{name}</option>)}</select></label></fieldset>
    {error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="primary-btn" disabled={busy}>{busy?'Menyimpan...':'Simpan informasi'}</button></div>
  </form><div className="destructive-actions"><p>Hapus dataset beserta seluruh tabelnya dari daftar aktif.</p><button type="button" className="danger-btn" disabled={busy} onClick={onDelete}>Hapus dataset</button></div></Dialog>;
}

export function TableManageModal({sheet,block,onClose,onSubmit,onDelete}){
  const [label,setLabel]=useState(block.label),[column,setColumn]=useState(block.schemaColumns[0]),[columnLabel,setColumnLabel]=useState(block.schemaLabels[0]||''),{busy,error,run}=useSubmit(onSubmit);
  const rowOptions=block.editableRowIndexes.filter(r=>!block.sectionRows.includes(r));
  const descriptor=/^(no\.?|nomor|kode rekening)$/i.test(block.schemaLabels[0]||'')&&block.schemaColumns.length>1?block.schemaColumns[1]:block.schemaColumns[0];
  const rowName=r=>displayCell(sheet.rows[r]?.[descriptor])||`Baris ${r+1}`;
  const [row,setRow]=useState(rowOptions[0]),[rowLabel,setRowLabel]=useState(rowOptions.length?rowName(rowOptions[0]):'');
  return <Dialog title="Kelola tabel" description={`Tabel tujuan: ${block.label}. Perubahan struktur hanya dapat dilakukan admin.`} busy={busy} onClose={onClose}>
    <form onSubmit={e=>{e.preventDefault();run({kind:'rename',label:label.trim()});}}><label>Nama tabel<input required maxLength={200} disabled={busy} value={label} onChange={e=>setLabel(e.target.value)}/></label><div className="form-actions"><button className="primary-btn" disabled={busy}>Simpan nama tabel</button></div></form>
    {!!block.schemaColumns.length&&<form onSubmit={e=>{e.preventDefault();run({kind:'renameColumn',colIndex:column,label:columnLabel.trim()});}}><fieldset disabled={busy} className="dynamic-form single"><label>Kolom yang dikelola<select value={column} onChange={e=>{const c=Number(e.target.value);setColumn(c);setColumnLabel(block.schemaLabels[block.schemaColumns.indexOf(c)]);}}>{block.schemaColumns.map((c,i)=><option key={c} value={c}>{block.schemaLabels[i]}</option>)}</select></label><label>Nama kolom<input required maxLength={200} value={columnLabel} onChange={e=>setColumnLabel(e.target.value)}/></label></fieldset><div className="form-actions"><button type="button" className="danger-btn" disabled={busy||block.schemaColumns.length<=1} onClick={()=>onDelete({kind:'deleteColumn',colIndex:column,label:columnLabel})}>Hapus kolom</button><button className="primary-btn" disabled={busy}>Simpan nama kolom</button></div></form>}
    {!!rowOptions.length&&<form onSubmit={e=>{e.preventDefault();run({kind:'renameRow',rowIndex:row,label:rowLabel.trim()});}}><fieldset className="dynamic-form single" disabled={busy}><label>Baris yang dikelola<select value={row} onChange={e=>{const r=Number(e.target.value);setRow(r);setRowLabel(rowName(r));}}>{rowOptions.map(r=><option key={r} value={r}>{rowName(r)} (baris {r+1})</option>)}</select></label><label>Nama komoditas / indikator<input required maxLength={200} value={rowLabel} onChange={e=>setRowLabel(e.target.value)}/></label></fieldset><div className="form-actions"><button type="button" className="danger-btn" disabled={busy} onClick={()=>onDelete({kind:'deleteRow',rowIndex:row,label:rowName(row)})}>Hapus baris</button><button className="primary-btn" disabled={busy}>Simpan nama baris</button></div></form>}
    {error&&<p className="error-box" role="alert">{error}</p>}<div className="destructive-actions"><p>Hapus hanya tabel ini, bukan seluruh dataset.</p><button className="danger-btn" disabled={busy} onClick={()=>onDelete({kind:'delete',label:block.label})}>Hapus tabel</button></div>
  </Dialog>;
}

export function DeleteModal({title,description,onClose,onSubmit}){
  const {busy,error,run}=useSubmit(onSubmit);
  return <Dialog title={title} description={description} busy={busy} onClose={onClose} initialFocus="[data-safe-cancel]"><p>Data tidak lagi tampil pada tabel aktif. Catatan penghapusan dan data sumber tetap tersimpan di database lokal.</p>{error&&<p className="error-box" role="alert">{error}</p>}<div className="form-actions"><button data-safe-cancel type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button className="danger-btn" disabled={busy} onClick={()=>run()}>{busy?'Menghapus...':'Ya, hapus'}</button></div></Dialog>;
}
