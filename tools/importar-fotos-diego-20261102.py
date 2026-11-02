#!/usr/bin/env python3
"""Importa fotos regionais licenciadas para a reportagem sobre biomecânica da pesca."""
import io,json,hashlib,pathlib,time,urllib.parse,urllib.request,sys
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((root/'tools/diego-fotos-biomecanica.json').read_text(encoding='utf8'))
target=root/'frontend/assets/reportagens/diego-movimento'
target.mkdir(parents=True,exist_ok=True)
status=[]
for item in items:
    filename=item['filename'].replace(' ','_')
    hashcode=hashlib.md5(filename.encode('utf-8')).hexdigest()
    encoded=urllib.parse.quote(filename)
    urls=['https://upload.wikimedia.org/wikipedia/commons/thumb/'+hashcode[0]+'/'+hashcode[:2]+'/'+encoded+'/1280px-'+encoded,'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+urllib.parse.quote(item['filename'])+'?width=1280']
    entry={**item,'status':'failed','errors':[]}
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'EntreMaresEducationalProject/1.0 (school pedagogical CC imagery, Github henriquelima02-ship-it/entremares)','Referer':'https://commons.wikimedia.org/','Accept':'image/jpeg,image/png,image/webp,image/*;q=0.8'})
            with urllib.request.urlopen(req,timeout=40) as resp:data=resp.read(14000001)
            if len(data)>14000000:raise ValueError('Over 14MB')
            img=Image.open(io.BytesIO(data));img.load();img=ImageOps.exif_transpose(img)
            if min(img.width,img.height)<320:raise ValueError('Image resolution too small')
            img.thumbnail((1280,960),Image.Resampling.LANCZOS)
            if img.mode not in ('RGB','RGBA'):img=img.convert('RGB')
            out=target/(item['slug']+'.webp')
            img.save(out,'WEBP',quality=83,method=5)
            entry.update(status='ok',width=img.width,height=img.height,size=out.stat().st_size)
            print('OK',item['slug'],img.size,flush=True);break
        except Exception as e:
            entry['errors'].append(str(e)[:220])
            time.sleep(.5)
    if entry['status']!='ok':print('FAILED',item['slug'],entry['errors'],flush=True)
    status.append(entry)
(root/'docs/RELATORIO_FOTOS_DIEGO_MOVIMENTO.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
if len(status)!=sum(x['status']=='ok' for x in status):sys.exit(1)
