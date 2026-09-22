import os, json, re, hashlib
from datetime import datetime, date
import openpyxl

BASE='/mnt/data/pdrb_build/source-excel'
OUT='/mnt/data/pdrb_build/backend/data/workbooks.json'

MAP={
'A. Dinas Pertanian.xlsx':('A','Pertanian, Kehutanan, dan Perikanan','Dinas Pertanian dan Ketahanan Pangan','sudah'),
'23. ESDA.xlsx':('B','Pertambangan dan Penggalian','ESDA','belum'),
'2. UMKM dan Nilai Produksi.xlsx':('C','Industri Pengolahan','Diskoperindag','belum'),
'3. Jumlah Koperasi dan Nilai Produksi.xlsx':('K','Jasa Keuangan dan Asuransi','Diskoperindag','belum'),
'1. Ekspor impor Diskoperindag.xlsx':('C','Industri Pengolahan','Diskoperindag','belum'),
'D. PT PLN.xlsx':('D','Pengadaan Listrik dan Gas','PLN','belum'),
'E. Dinas Lingkungan Hidup.xlsx':('E','Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang','Dinas Lingkungan Hidup','sudah'),
'E. PDAM.xlsx':('E','Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang','PDAM','belum'),
'F. Dinas PUPR.xlsx':('F','Konstruksi','Dinas PUPR','sudah'),
'F. Dinas Penanaman Modal Satu Pintu.xlsx':('K','Jasa Keuangan / PMTB','DPMPTSP','belum'),
'2a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2025.xlsx':('K','Jasa Keuangan / PMTB','DPMPTSP','belum'),
'3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx':('K','Jasa Keuangan / PMTB','DPMPTSP','belum'),
'3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx':('K','Jasa Keuangan / PMTB','DPMPTSP','belum'),
'Pertamina.xlsx':('G','Perdagangan Besar dan Eceran','Pertamina Patra Niaga','belum'),
'H. Dinas Perhubungan.xlsx':('H','Transportasi dan Pergudangan','Dinas Perhubungan','sudah'),
'H. PT POS.xlsx':('H','Transportasi dan Pergudangan','PT Pos Indonesia dan Shopee Xpress','belum'),
'1 PI. BULOG.xlsx':('H','Transportasi dan Pergudangan','BULOG','on-progress'),
'K. BPJS Kesehatan.xlsx':('K','Jasa Keuangan dan Asuransi','BPJS Kesehatan','belum'),
'K. BPJS Ketenagakerjaan.xlsx':('K','Jasa Keuangan dan Asuransi','BPJS Ketenagakerjaan','belum'),
'PT Pegadaian.xlsx':('K','Jasa Keuangan dan Asuransi','PT Pegadaian','belum'),
'O. BKAD.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'O. APBdes.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','DP3AP2KB','sudah'),
'Penyusunan PDRB Triwulan DP3AP2KB.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','DP3AP2KB','sudah'),
'P. Dinas Pendidikan.xlsx':('P','Jasa Pendidikan','Dinas Pendidikan','sudah'),
'Q. Dinas Kesehatan.xlsx':('Q','Jasa Kesehatan dan Kegiatan Sosial','Dinas Kesehatan','on-progress'),
'1. LNP Bakesbangpol.xlsx':('Q','Jasa Kesehatan dan Kegiatan Sosial / PKLNPRT','Bakesbangpol','sudah'),
'R. Dinas Pariwisata.xlsx':('R','Dinas Pariwisata','Dinas Pariwisata','belum'),
'Bapenda.xlsx':(None,'Belum dipetakan dari master PDRB','Bapenda','belum'),
'1. BPS LRA Januari 2025 gabung (Bapenda).xlsx':(None,'Belum dipetakan dari master PDRB','Bapenda','belum'),
'13. BPS LRA Juni (Bapenda).xlsx':(None,'Belum dipetakan dari master PDRB','Bapenda','belum'),
'ATV.xlsx':(None,'Belum dipetakan dari master PDRB','Agropolitan TV','belum'),
'2025_1 LRA Triwulan I.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'2025_2 LRA Triwulan II 2025.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'2025_3 LRA Triwulan 3 T.A. 2025.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'2025_4 LRA TW 4 2025.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'2026_1 lra-konsolidasi-kota-batu triwulan 1 2026.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
'2026_2 LRA TW II 2026 sementara.xlsx':('O','Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib','Badan Keuangan dan Aset Daerah','belum'),
}

def serial(v):
    if isinstance(v,(datetime,date)):
        return v.isoformat()
    if isinstance(v,float) and v.is_integer():
        return int(v)
    return v

def slug(s):
    return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')

workbooks=[]
for fname in sorted(f for f in os.listdir(BASE) if f.lower().endswith('.xlsx')):
    path=os.path.join(BASE,fname)
    wb=openpyxl.load_workbook(path,data_only=False)
    try: wb_cached=openpyxl.load_workbook(path,data_only=True)
    except Exception: wb_cached=None
    code, sector, inst, status = MAP.get(fname,(None,'Belum dipetakan','Belum dipetakan','belum'))
    wid=slug(os.path.splitext(fname)[0])
    sheets=[]
    for idx,ws in enumerate(wb.worksheets):
        cws=wb_cached[ws.title] if wb_cached and ws.title in wb_cached.sheetnames else None
        maxr=ws.max_row or 0; maxc=ws.max_column or 0
        rows=[]
        for r in range(1,maxr+1):
            row=[]
            for c in range(1,maxc+1):
                cell=ws.cell(r,c); val=cell.value
                if val is None:
                    row.append(None); continue
                typ='string'
                calc=None
                if isinstance(val,str) and val.startswith('='):
                    typ='formula'
                    if cws:
                        calc=serial(cws.cell(r,c).value)
                elif cell.data_type=='e' or (isinstance(val,str) and val.startswith('#')):
                    typ='error'
                elif isinstance(val,(datetime,date)):
                    typ='date'
                elif isinstance(val,(int,float)):
                    typ='number'
                row.append({'v':serial(val),'t':typ,'calc':calc,'fmt':cell.number_format})
            rows.append(row)
        sheets.append({'id':f'{wid}-{idx}','name':ws.title,'rows':rows,'maxRow':maxr,'maxCol':maxc,'mergedRanges':[str(x) for x in ws.merged_cells.ranges]})
    workbooks.append({'id':wid,'file':fname,'institution':inst,'pdrbCode':code,'sector':sector,'status':status,'sheets':sheets})

os.makedirs(os.path.dirname(OUT),exist_ok=True)
with open(OUT,'w',encoding='utf-8') as f: json.dump({'version':1,'generatedAt':datetime.now().isoformat(),'workbooks':workbooks},f,ensure_ascii=False,separators=(',',':'))
print('generated',OUT,'workbooks',len(workbooks),'size',os.path.getsize(OUT))
