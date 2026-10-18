import fs from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {detectBlocks} from '../src/lib/sheetPresentation.mjs';
import {withNamedColumns} from '../src/lib/periods.mjs';
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
  const {default:CleanDataTable,TableSourceNotes}=await vite.ssrLoadModule('/src/components/CleanDataTable.jsx');
  const seed=JSON.parse(fs.readFileSync('backend/data/workbooks.json','utf8'));
  let tables=0;
  for(const workbook of seed.workbooks)for(const sheet of workbook.sheets)for(const block of detectBlocks(sheet)){
    if(!block.rowIndexes.length){renderToStaticMarkup(React.createElement(TableSourceNotes,{block}));continue;}
    for(const editing of [false,true]){
      const displayBlock=editing?{...block,columns:block.schemaColumns,labels:block.schemaLabels,headerPaths:block.schemaPaths}:withNamedColumns(block);
      const html=renderToStaticMarkup(React.createElement(CleanDataTable,{sheet,sheetIndex:0,block:displayBlock,rows:block.rowIndexes.map(index=>({row:sheet.rows[index],index})),editing,onSave:()=>{}}));
      assert(!/<th\b[^>]*>\s*<\/th>/.test(html),`${sheet.id}: empty heading`);
      assert(!/<tbody>[\s\S]*<td[^>]*>\s*<\/td>/.test(html),`${sheet.id}: blank value without placeholder`);
    }
    tables++;
  }
  console.log(`Rendered ${tables} populated tables in read and admin edit modes; remaining templates render source notes without empty grids.`);
}finally{await vite.close();}
