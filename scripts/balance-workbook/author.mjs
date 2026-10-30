import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile,FileBlob} from '@oai/artifact-tool';
const csv=await fs.readFile('config/balance.csv','utf8'),rows=csv.trim().split(/\r?\n/).map(row=>row.split(','));
const exists=await fs.access('config/游戏数值.xlsx').then(()=>true,()=>false);
const wb=exists?await SpreadsheetFile.importXlsx(await FileBlob.load('config/游戏数值.xlsx')):Workbook.create(),sheet=exists?wb.worksheets.getItem('数值配置'):wb.worksheets.add('数值配置');
sheet.showGridLines=false;sheet.freezePanes.freezeRows(1);sheet.freezePanes.freezeColumns(3);
const values=rows.map((row,i)=>i?row.map((v,j)=>[3,4,5].includes(j)?Number(v):v):row);
sheet.getRange(`A1:H${rows.length}`).values=values;
sheet.getRange(`A1:H${rows.length}`).format.font.name='Arial';sheet.getRange(`A1:H${rows.length}`).format.font.size=11;sheet.getRange(`A1:H${rows.length}`).format.rowHeight=25;
sheet.getRange('A1:H1').format.fill='#253438';sheet.getRange('A1:H1').format.font.color='#FFFFFF';sheet.getRange('A1:H1').format.font.bold=true;sheet.getRange('A1:H1').format.horizontalAlignment='center';
sheet.getRange(`D2:D${rows.length}`).format.fill='#FFF1BF';for(let i=1;i<rows.length;i++)for(let j=3;j<=5;j++){const decimals=rows[i][j].split('.')[1]?.length||0;sheet.getCell(i,j).setNumberFormat(decimals?'0.'+'0'.repeat(decimals):'0');}
for(const [col,width]of [['A',24],['B',10],['C',23],['D',12],['E',10],['F',10],['G',15],['H',63]])sheet.getRange(`${col}1:${col}${rows.length}`).format.columnWidth=width;
for(let i=1;i<rows.length;i++){const r=i+1;sheet.getRange(`D${r}`).dataValidation={rule:{type:'decimal',operator:'between',formula1:Number(rows[i][4]),formula2:Number(rows[i][5])}};}
const guide=exists?wb.worksheets.getItem('使用说明'):wb.worksheets.add('使用说明');guide.showGridLines=false;guide.getRange('A1:B9').values=[['游戏配表使用说明',''],['修改位置','只修改“数值配置”工作表 D 列黄色 value 单元格。'],['保存格式','保存为原来的 .xlsx，不改字段名称、键或表头。'],['应用方式','保存并关闭表格，双击项目根目录“应用配表.cmd”。'],['本地体验','应用成功后打开 http://127.0.0.1:5189 。'],['线上生效','本地改表不会自动修改线上网站，需要重新发布。'],['校验规则','空值、非法值、重复键、缺失键及违反规则的组合会被拒绝。'],['关键约束','腾空散布≤移动散布≤站立散布；空匣换弹≤非空匣换弹。'],['来源','项目 config/balance.csv；本轮用户确认的游戏规则。']];guide.getRange('A1:B9').format.font.name='Arial';guide.getRange('A1:B9').format.font.size=11;guide.getRange('A1:A9').format.columnWidth=18;guide.getRange('B1:B9').format.columnWidth=98;guide.getRange('A1:B9').format.rowHeight=28;guide.getRange('A1:B1').format.font.bold=true;
wb.recalculate();console.log((await wb.inspect({kind:'table',range:'数值配置!A14:H18',include:'values,formulas',tableMaxRows:5,tableMaxCols:8})).ndjson);
const out=await SpreadsheetFile.exportXlsx(wb);await out.save('config/游戏数值.xlsx');
await fs.mkdir('outputs/01a18cf1-8d24-7083-b118-99528984e739',{recursive:true});
for(const [sheetName,range,file]of [['数值配置','A1:H17','balance-preview.png'],['数值配置',`A18:H${rows.length}`,'balance-preview-bottom.png'],['使用说明','A1:B9','guide-preview.png']]){try{const blob=await wb.render({sheetName,range,scale:1.5});await fs.writeFile('outputs/01a18cf1-8d24-7083-b118-99528984e739/'+file,new Uint8Array(await blob.arrayBuffer()));}catch(e){console.error('Render limit: '+e.message);}}
try{await fs.rename('config/游戏数值.xlsx.inspect.ndjson','outputs/01a18cf1-8d24-7083-b118-99528984e739/workbook-inspect.ndjson');}catch{}
console.log('Saved config/游戏数值.xlsx');
