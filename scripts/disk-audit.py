"""Read-only size audit. Never follows Windows junctions; writes reports on F:."""
import os, json, time, heapq
from pathlib import Path
from datetime import datetime
ROOT=Path(__file__).resolve().parent.parent
today=datetime(2026,10,30).timestamp()
targets=[Path('C:/Users/sx_71/.cache'),Path('C:/Users/sx_71/.codex'),Path('C:/Users/sx_71/AppData/Local'),Path('C:/Users/sx_71/AppData/Roaming'),Path('C:/Windows/Temp')]
groups={}; large=[]; errors=0;count=0
for base in targets:
    stack=[base]
    while stack:
        folder=stack.pop()
        try:
            with os.scandir(folder) as entries:
                for e in entries:
                    try:
                        st=e.stat(follow_symlinks=False)
                        if e.is_symlink() or getattr(st,'st_file_attributes',0)&0x400: continue
                        if e.is_dir(follow_symlinks=False): stack.append(Path(e.path));continue
                        if not e.is_file(follow_symlinks=False):continue
                        count+=1; rel=Path(e.path).relative_to(base).parts
                        depth=2 if base.name in ['Local','.cache','.codex'] else 1
                        key=str(base.joinpath(*rel[:depth])) if len(rel)>depth else str(base)
                        g=groups.setdefault(key,{'bytes':0,'modified_today_bytes':0,'created_today_bytes':0,'files':0})
                        g['bytes']+=st.st_size;g['files']+=1
                        if st.st_mtime>=today:g['modified_today_bytes']+=st.st_size
                        created=getattr(st,'st_birthtime',st.st_ctime)
                        if created>=today:g['created_today_bytes']+=st.st_size
                        item=(st.st_size,e.path,st.st_mtime,created)
                        if len(large)<60:heapq.heappush(large,item)
                        elif item[0]>large[0][0]:heapq.heapreplace(large,item)
                    except OSError:errors+=1
        except OSError:errors+=1
report={'scanned_files':count,'inaccessible':errors,'groups':sorted([dict(path=k,**v) for k,v in groups.items()],key=lambda x:x['bytes'],reverse=True),'largest_files':[{'bytes':size,'path':path,'modified':datetime.fromtimestamp(m).isoformat(),'created':datetime.fromtimestamp(c).isoformat()}for size,path,m,c in sorted(large,reverse=True)]}
out=ROOT/'outputs'/'disk-audit.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'report':str(out),'scanned_files':count,'inaccessible':errors,'largest_groups':report['groups'][:15],'recent_created_groups':sorted(report['groups'],key=lambda g:g['created_today_bytes'],reverse=True)[:12],'largest_files':report['largest_files'][:15]},ensure_ascii=False))
