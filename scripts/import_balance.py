"""Read the designer workbook using only the Python standard library."""
from pathlib import Path
import csv
import io
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def read_rows(path):
    with zipfile.ZipFile(path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in tree.findall('s:sheetData/s:row', NS):
            values = [''] * 8
            for cell in row.findall('s:c', NS):
                ref = cell.attrib['r']; col = ''.join(c for c in ref if c.isalpha())
                if len(col) != 1 or not ('A' <= col <= 'H'):
                    continue
                if cell.find('s:f', NS) is not None:
                    raise ValueError(f'{ref}: 配表不接受公式，请直接填写数值')
                value = cell.find('s:v', NS)
                text = value.text if value is not None and value.text else ''
                if cell.attrib.get('t') == 's':
                    text = strings[int(text)]
                elif cell.attrib.get('t') == 'inlineStr':
                    text = ''.join(cell.find('s:is', NS).itertext())
                values[ord(col) - 65] = text
            if any(values):
                rows.append(values)
        return rows

def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'config' / '游戏数值.xlsx'
    rows = read_rows(source)
    output = io.StringIO(newline=''); csv.writer(output, lineterminator='\n').writerows(rows)
    text = output.getvalue()
    # Validate everything before touching the currently valid configuration.
    result = subprocess.run(['node', str(ROOT / 'scripts' / 'validate-balance.mjs')], input=text, text=True, encoding='utf-8', cwd=ROOT)
    if result.returncode:
        raise ValueError('配表校验未通过，旧数值未被覆盖')
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'config' / 'balance.csv'
    temp = target.with_suffix('.csv.tmp'); temp.write_text(text, encoding='utf-8'); temp.replace(target)
    print('配表已应用。重新启动本地游戏后生效；线上版本需要重新发布。')

if __name__ == '__main__':
    try:
        main()
    except (ValueError, FileNotFoundError, KeyError, zipfile.BadZipFile) as e:
        print(str(e), file=sys.stderr); sys.exit(1)
