#!/usr/bin/env python3
"""Busca referências enviadas pela equipe e produz relatório de arquivos aproveitáveis."""
import datetime,io,json,pathlib,sys,urllib.parse,urllib.request
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((root/'tools'/'nagila-new-photo-sources.json').read_text(encoding='utf8'))
out=root/'frontend'/'assets'/'plantas-nagila'/'revisadas'
out.mkdir(parents=True,exist_ok=True)
rows=[]
for item in items:
    row={**item,'status':'failed','file':None,'error':None}
    parsed=urllib.parse.urlsplit(item['url'])
    req=urllib.request.Request(item['url'],headers={
      'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
      'Accept':'image/avif,image/webp,image/apng,image/png,image/jpeg,image/*;q=0.7,*/*;q=0.1',
      'Referer':parsed.scheme+'://'+parsed.netloc+'/',
      'Accept-Language':'pt-BR,pt;q=0.9,en;q=0.6'
    })
    try:
      with urllib.request.urlopen(req, timeout=18) as r:
        content=r.read(10_000_001)
      if len(content)>10_000_000:raise ValueError('Imagem maior que 10MB')
      img=Image.open(io.BytesIO(content))
      img.load()
      img=ImageOps.exif_transpose(img)
      if img.width<150 or img.height<150:raise ValueError('Imagem muito pequena')
      img.thumbnail((1100,850),Image.Resampling.LANCZOS)
      if img.mode not in ('RGB','RGBA'):img=img.convert('RGB')
      file=out/(item['id']+'.webp')
      img.save(file,'WEBP',quality=83,method=5)
      row.update(status='ok',file=str(file.relative_to(root)),width=img.width,height=img.height,bytes=file.stat().st_size)
      print('OK',item['id'],img.width,img.height,flush=True)
    except Exception as e:
      row['error']=str(e)[:220]
      print('FALHA',item['id'],row['error'],flush=True)
    rows.append(row)
report=root/'docs'/'RELATORIO_IMAGENS_PLANTAS_NAGILA_ATUALIZADAS.json'
report.write_text(json.dumps({'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'items':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('RESULTADO',sum(x['status']=='ok' for x in rows),'/',len(rows),flush=True)
if not any(x['status']=='ok' for x in rows):sys.exit(2)
