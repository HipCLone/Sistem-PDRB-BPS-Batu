import { useState } from 'react';
import { cellClassName, displayCell, formatCell } from '../lib/format';
import { hasContent, isUnavailableCell } from '../lib/cells.mjs';
import { mergedCells, mergedValue } from '../lib/sheetPresentation.mjs';

function CellEditor({cell,onSave,label}){
  const initialValue=isUnavailableCell(cell)?'':displayCell(cell);
  const [v,setV]=useState(initialValue);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  return <><input
    className="cell-input"
    value={v}
    disabled={busy}
    aria-label={label||'Nilai sel'}
    aria-invalid={!!error}
    onChange={e=>setV(e.target.value)}
    placeholder={isUnavailableCell(cell)?'Hasil belum tersedia':undefined}
    onBlur={async()=>{if(v===initialValue||busy)return;setBusy(true);setError('');try{await onSave(v);}catch(e){setError(e.message);}finally{setBusy(false);}}}
    onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}
  />{error&&<span className="cell-error" role="alert">{error} Fokus lalu tinggalkan sel untuk mencoba lagi.</span>}</>;
}

function CellValue({cell}){
  const v=formatCell(cell);
  const formula=cell?.t==='formula'?String(cell.v||''):'';
  const unavailable=isUnavailableCell(cell);
  const cls=!hasContent(cell)?'missing-cell':cell?.t==='formula'?'formula-cell':'';
  const title=unavailable?'Hasil rumus tidak tersedia atau terdapat error pada Excel sumber.':!hasContent(cell)?'Belum ada nilai pada Excel sumber.':undefined;
  return <span className={cls} title={[title,formula?`Rumus sumber: ${formula}`:''].filter(Boolean).join(' ')||undefined}>{v}</span>;
}

export function TableSourceNotes({block}){
  return <>
    {block.unavailableCount>0&&<p className="table-notice" role="note">{block.unavailableCount} sel memiliki rumus tanpa hasil tersimpan atau error Excel. Ditampilkan sebagai "-", bukan nol.</p>}
    {block.unlabelledColumns.length>0&&<p className="table-notice" role="note">Sebagian kolom tidak diberi judul pada Excel. Label “sumber” mengikuti posisi kolom aslinya; nilainya tetap ditampilkan.</p>}
    {block.notes.length>0&&<details className="data-table-notes"><summary>Judul dan catatan Excel sumber</summary>{block.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}
  </>;
}

export default function CleanDataTable({sheet,sheetIndex,block,rows,editing,onSave,onDeleteRow}){
  const {columns,labels}=block;
  const merges=mergedCells(sheet);
  const descriptorIndex=/^(no\.?|nomor|kode rekening)$/i.test(labels[0]||'')&&columns.length>1?1:0;

  return <>
    <TableSourceNotes block={block}/>
    {block.isTemplate&&<p className="table-notice">Struktur indikator tersedia, tetapi kolom nilai belum diisi pada Excel sumber.</p>}

    <div className="data-table-summary">
      <span><b>{block.rowIndexes.length}</b> baris data</span>
      <span><b>{columns.length}</b> {editing?'kolom tersedia':'kolom terisi'}</span>
      <span>{editing?'Isi atau ubah nilai, lalu tekan Enter atau pindah sel untuk menyimpan.':'Baris dan kolom tanpa isi disembunyikan. "-" berarti nilai belum tersedia.'}</span>
    </div>

    <div className="excel-wrap clean-table-wrap" tabIndex={0} role="region" aria-label={`Tabel ${block.label}, geser untuk melihat semua kolom`}>
      <table className="excel-table clean-table">
        <caption>{block.label}</caption>
        <thead><tr>{columns.map((ci,i)=><th key={ci} className={i===descriptorIndex?'descriptor-cell':undefined} scope="col" title={labels[i]}>{block.headerPaths[i].map((part,n)=><span className="table-header-part" key={n}>{part}</span>)}</th>)}{editing&&onDeleteRow&&<th scope="col">Tindakan baris</th>}</tr></thead>
        <tbody>
          {rows.map(({row,index})=>block.sectionRows.includes(index)?<tr key={index} className="table-section"><th scope="rowgroup" colSpan={columns.length+(editing&&onDeleteRow?1:0)}>{row.filter(hasContent).map(displayCell).join(' · ')}</th></tr>:<tr key={index}>
            {columns.map((ci,i)=>{
              const merge=!editing&&merges.find(m=>m.r===index&&m.endRow===index&&m.endCol>m.c&&ci>=m.c&&ci<=m.endCol);
              const spanned=merge?columns.filter(c=>c>=merge.c&&c<=merge.endCol):[ci];
              if(merge&&ci!==spanned[0])return null;
              const descriptor=spanned.includes(columns[descriptorIndex]);
              return <td key={ci} colSpan={spanned.length>1?spanned.length:undefined} className={[cellClassName(mergedValue(sheet,index,ci,merges)),descriptor?'descriptor-cell':''].filter(Boolean).join(' ')}>
                {editing&&!merges.some(m=>index>=m.r&&index<=m.endRow&&ci>=m.c&&ci<=m.endCol&&(index!==m.r||ci!==m.c))
                  ? <CellEditor key={`${sheetIndex}:${index}:${ci}:${displayCell(row[ci])}`} cell={row[ci]} label={`${labels[i]}, baris ${index+1}`} onSave={v=>onSave(sheetIndex,index,ci,v)}/>
                  : <CellValue cell={mergedValue(sheet,index,ci,merges)}/>}
              </td>;
            })}
            {editing&&onDeleteRow&&<td><button className="danger-btn" onClick={()=>onDeleteRow(index)} aria-label={`Hapus baris ${index+1}`}>Hapus baris</button></td>}
          </tr>)}
        </tbody>
      </table>
    </div>
  </>;
}
