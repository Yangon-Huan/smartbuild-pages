from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, threading, zipfile
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
CONFIG=ROOT/'config.md'
def parse_md():
    text=CONFIG.read_text(encoding='utf-8-sig')
    result={}
    section=None
    for raw in text.splitlines():
        line=raw.strip()
        if not line:
            continue
        if line.startswith('## '):
            section=line[3:].strip()
            result[section]={}
            continue
        if line.startswith('# ') and not line.startswith('## '):
            continue
        if section and ':' in line:
            key,value=line.split(':',1)
            result[section][key.strip()]=value.strip()
    return result
def signature():
    try:
        stat=CONFIG.stat()
        return f'{stat.st_mtime_ns}-{stat.st_size}'
    except OSError:
        return 'missing'

EXPORT_LOCK=threading.Lock()
EXPORT_NAME='导出测量数据.xlsx'
SHEET_NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main'

def export_measurement_workbook(file_name, card_id, location='', output_dir=None):
    if not isinstance(file_name,str) or not file_name.lower().endswith(('.ply','.xyz','.pts','.txt','.csv')):
        raise ValueError('无效的点云文件名')
    if not file_name or len(file_name)>160 or Path(file_name).name!=file_name or '/' in file_name or chr(92) in file_name:
        raise ValueError('无效的点云文件名')
    if not (ROOT/'data'/file_name).is_file():
        raise ValueError('软件 data 目录中找不到对应点云文件')
    if not isinstance(card_id,int) or isinstance(card_id,bool) or not 0<=card_id<1000:
        raise ValueError('无效的工作区编号')
    config=parse_md();detail=config.get('analysis_detail',{});export=config.get('measurement_export',{})
    headers=[item.strip() for item in detail.get('measurement_columns','').split('|') if item.strip()]
    values=[item.strip() for item in detail.get('measurement_values','').split('|')]
    if len(headers)!=6 or len(values)!=6:
        raise ValueError('config.md 中的测量列或数值不完整')
    destination=Path(output_dir) if output_dir is not None else ROOT/'data'/'导出数据'
    destination.mkdir(parents=True,exist_ok=True)
    target=destination/EXPORT_NAME
    location=str(location or '')[:30] or str(card_id+1)
    new_record=[file_name,location,*values]

    def read_cell(cell):
        if cell.get('t')=='inlineStr':
            return ''.join(part.text or '' for part in cell.iter(f'{{{SHEET_NS}}}t'))
        value=cell.find(f'{{{SHEET_NS}}}v')
        return value.text if value is not None and value.text is not None else ''

    def cell(column,row,value):
        address=f'{chr(65+column)}{row}'
        if 2<=column<=7 and row>=4:
            try:
                number=float(value)
                if value and number==number and abs(number)<1e15:
                    return f'<c r="{address}"><v>{escape(str(value))}</v></c>'
            except (ValueError,TypeError):
                pass
        if column==1 and row==1:
            return f'<c r="{address}"><v>{value}</v></c>'
        return f'<c r="{address}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'

    with EXPORT_LOCK:
        records=[]
        if target.exists():
            try:
                with zipfile.ZipFile(target) as archive:
                    sheet=ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
                rows=sheet.findall(f'.//{{{SHEET_NS}}}row')
                expected=['点云文件','工作区',*headers]
                if len(rows)<3 or [read_cell(c) for c in rows[2].findall(f'{{{SHEET_NS}}}c')]!=expected:
                    raise ValueError('现有汇总表的列与当前配置不一致')
                for row in rows[3:]:
                    values_in_row=[read_cell(c) for c in row.findall(f'{{{SHEET_NS}}}c')]
                    if len(values_in_row)!=8 or not values_in_row[0]:
                        raise ValueError('现有汇总表含有不完整的点云记录')
                    records.append(values_in_row)
            except (zipfile.BadZipFile,KeyError,ET.ParseError) as error:
                raise ValueError('现有汇总 Excel 文件无法读取') from error
        matches=[index for index,record in enumerate(records) if record[0].casefold()==file_name.casefold()]
        if matches:
            records[matches[0]]=new_record
            for index in reversed(matches[1:]):
                del records[index]
        else:
            records.append(new_record)
        rows=[['点云记录数',len(records)],['数据来源',export.get('source_value','本地预设演示结果')],['点云文件','工作区',*headers],*records]
        sheet_rows=''.join(f'<row r="{row_number}">'+''.join(cell(column,row_number,value) for column,value in enumerate(row))+'</row>' for row_number,row in enumerate(rows,1))
        sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="'+SHEET_NS+'"><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="27" customWidth="1"/><col min="2" max="2" width="17" customWidth="1"/><col min="3" max="8" width="32" customWidth="1"/></cols><sheetData>'+sheet_rows+'</sheetData></worksheet>'
        workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="'+SHEET_NS+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="测量数据" sheetId="1" r:id="rId1"/></sheets></workbook>'
        content_types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
        relationships='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
        workbook_relationships='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
        import tempfile
        with tempfile.NamedTemporaryFile(dir=destination,prefix='measurements-',suffix='.tmp',delete=False) as handle:
            temporary=Path(handle.name)
        try:
            with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as archive:
                for entry,content in {'[Content_Types].xml':content_types,'_rels/.rels':relationships,'xl/workbook.xml':workbook,'xl/_rels/workbook.xml.rels':workbook_relationships,'xl/worksheets/sheet1.xml':sheet}.items():
                    archive.writestr(entry,content)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    return target


def analyze_export_folder(folder_name, file_names):
    config=parse_md();configured=config.get('one_click_analysis',{})
    expected=configured.get('folder_name','导出数据')
    if folder_name!=expected or not isinstance(file_names,list) or not 0<len(file_names)<=1000:
        raise ValueError('请选择 data 下的导出数据文件夹')
    folder=ROOT/'data'/expected
    if not folder.is_dir():raise ValueError('导出数据文件夹不存在')
    names=[];seen=set()
    for name in file_names:
        if not isinstance(name,str) or len(name)>160 or not name.lower().endswith(('.ply','.xyz','.pts','.txt','.csv')) or Path(name).name!=name or '/' in name or chr(92) in name:
            raise ValueError('所选文件夹包含无效的点云文件名')
        if not (folder/name).is_file():raise ValueError('所选文件夹与软件 data/导出数据 不匹配')
        if name.casefold() not in seen:names.append(name);seen.add(name.casefold())
    def read_cell(cell):
        if cell.get('t')=='inlineStr':return ''.join(part.text or '' for part in cell.iter(f'{{{SHEET_NS}}}t'))
        value=cell.find(f'{{{SHEET_NS}}}v')
        return value.text if value is not None and value.text is not None else ''
    saved={}
    for target in (folder/EXPORT_NAME,ROOT/'data'/EXPORT_NAME):
        if not target.is_file():continue
        try:
            with zipfile.ZipFile(target) as archive:sheet=ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
            rows=[[read_cell(c) for c in row.findall(f'{{{SHEET_NS}}}c')] for row in sheet.findall(f'.//{{{SHEET_NS}}}row')]
            for row in rows[3:]:
                if len(row)==8 and row[0]:saved[row[0].casefold()]=row[2:]
        except (zipfile.BadZipFile,KeyError,ET.ParseError):continue
    preset=[item.strip() for item in config.get('analysis_detail',{}).get('measurement_values','').split('|')]
    if len(preset)!=6:raise ValueError('config.md 的测量演示值不完整')
    entries=[]
    for index,name in enumerate(sorted(names,key=str.casefold),1):
        values=saved.get(name.casefold())
        entries.append({'label':f'第{index}组','file_name':name,'values':values or preset,'source':'已导出测量值' if values else '演示预设值','twist':'合格'})
    summary=[]
    for column in range(6):
        values=[entry['values'][column] for entry in entries if entry['values'][column]!='']
        if not values:summary.append('');continue
        try:summary.append(f'{sum(float(value) for value in values)/len(values):.2f}')
        except ValueError:summary.append(values[0] if all(value==values[0] for value in values) else '—')
    return {'rows':entries,'summary':summary,'file_count':len(entries),'measured_count':len(entries)}

class Handler(SimpleHTTPRequestHandler):
    # 允许跨域访问本站接口的前端来源（GitHub Pages 静态站）
    ALLOW_ORIGINS = {'https://yangon-huan.github.io'}
    # 仅本机浏览器可直接调用 /api/shutdown
    LOCAL_ORIGINS = {'http://127.0.0.1:8876', 'http://localhost:8876'}
    def log_message(self,fmt,*args): pass
    def _origin_ok(self):
        origin = self.headers.get('Origin')
        return bool(origin) and (origin in self.ALLOW_ORIGINS or origin in self.LOCAL_ORIGINS)
    def _send_cors(self):
        if self._origin_ok():
            self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin'))
            self.send_header('Vary', 'Origin')
    def end_headers(self):
        self._send_cors()
        if self.command == 'GET':
            self.send_header('Cache-Control', 'no-store, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '600')
        self.send_header('Content-Length', '0')
        self.end_headers()
    def do_POST(self):
        if self.path == '/api/one-click-analysis':
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=65536: raise ValueError('请求过大或为空')
                request=json.loads(self.rfile.read(length).decode('utf-8'))
                result=analyze_export_folder(request.get('folder_name'),request.get('files'))
                body=json.dumps({'ok':True,**result},ensure_ascii=False).encode('utf-8')
                self.send_response(200)
            except (ValueError,TypeError,KeyError,json.JSONDecodeError) as error:
                body=json.dumps({'ok':False,'error':str(error)},ensure_ascii=False).encode('utf-8')
                self.send_response(400)
            self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers();self.wfile.write(body)
            return
        if self.path == '/api/export-measurements':
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=8192: raise ValueError('请求过大或为空')
                request=json.loads(self.rfile.read(length).decode('utf-8'))
                target=export_measurement_workbook(request.get('file_name'),request.get('card_id'),request.get('location',''))
                body=json.dumps({'ok':True,'filename':target.name,'relative_path':target.relative_to(ROOT).as_posix()},ensure_ascii=False).encode('utf-8')
                self.send_response(200);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
            except (ValueError,TypeError,KeyError,json.JSONDecodeError) as error:
                self.send_error(400,str(error))
            except OSError as error:
                self.send_error(500,str(error))
            return
        if self.path != '/api/shutdown':
            self.send_error(404)
            return
        # 只允许本机浏览器触发退出，避免公网访客一键关掉服务
        origin = self.headers.get('Origin')
        if origin and origin not in self.LOCAL_ORIGINS:
            self.send_error(403, 'forbidden')
            return
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'{"ok":true}')
        threading.Thread(target=self.server.shutdown, daemon=True).start()
    def do_GET(self):
        if self.path.split('?',1)[0]=='/api/config':
            try:
                body=json.dumps({'version':signature(),'config':parse_md()},ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type','application/json; charset=utf-8')
                self.send_header('Content-Length',str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as error: self.send_error(500,str(error))
        else: super().do_GET()
if __name__=='__main__':
    server=ThreadingHTTPServer(('127.0.0.1',8876),Handler)
    print('Local app: http://127.0.0.1:8876/')
    try: server.serve_forever()
    except KeyboardInterrupt: pass
