#!/usr/bin/env python3
"""Importa uma vez fotografias botânicas de licença verificável para o acervo escolar."""
import hashlib,io,json,pathlib,time,urllib.parse,urllib.request,datetime,sys
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'tools'/'plantas-nagila-sources.json').read_text(encoding='utf8'))
out=root/'frontend'/'assets'/'plantas-nagila'
out.mkdir(parents=True,exist_ok=True)
rows=[]
Image.MAX_IMAGE_PIXELS=36_000_000
for item in manifest:
    fname=item['file'].replace(' ','_')
    h=hashlib.md5(fname.encode('utf8')).hexdigest()
    quoted=urllib.parse.quote(fname,safe='()')
    urls=[
      'https://commons.wikimedia.org/wiki/Special:FilePath/'+quoted+'?width=800',
      'https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+quoted
    ]
    row={**item,'status':'failed','local_file':None,'error':None}
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={
              'User-Agent':'EntreMaresEdu/1.0 (https://henriquelima02-ship-it.github.io/entremares/; educational and Wikimedia attribution; Python-urllib)',
              'Accept':'image/jpeg,image/png,image/webp,image/*;q=0.8',
              'Referer':'https://commons.wikimedia.org/',
              'Accept-Language':'pt-BR,pt;q=0.9,en;q=0.7'
            })
            with urllib.request.urlopen(req,timeout=18) as r:
                data=r.read(13_000_001)
            if len(data)>13_000_000:raise ValueError('Arquivo maior que 13 MB')
            image=Image.open(io.BytesIO(data))
            image.load()
            image=ImageOps.exif_transpose(image)
            if image.width<180 or image.height<180:raise ValueError('Imagem menor que 180px')
            image.thumbnail((1100,880),Image.Resampling.LANCZOS)
            if image.mode not in ('RGB','RGBA'):image=image.convert('RGB')
            dst=out/(item['id']+'.webp')
            image.save(dst,'WEBP',quality=82,method=5)
            row.update(status='ok',local_file=str(dst.relative_to(root)),size_bytes=dst.stat().st_size,width=image.width,height=image.height,error=None)
            print('OK',item['id'],image.size,dst.stat().st_size,flush=True)
            break
        except Exception as exc:
            row['error']=str(exc)[:180]
            print('TRY FAILED',item['id'],url.split('/')[2],str(exc)[:130],flush=True)
            time.sleep(1)
    rows.append(row)
    time.sleep(1)
dest=root/'docs'/'RELATORIO_IMAGENS_PLANTAS_NAGILA.json'
dest.write_text(json.dumps({'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'items':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('TOTAL',sum(x['status']=='ok' for x in rows),'/',len(rows),flush=True)
if not any(x['status']=='ok' for x in rows):sys.exit(2)
