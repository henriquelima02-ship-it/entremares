#!/usr/bin/env python3
"""Importação pontual de fotos licenciadas do litoral paranaense (reportagem Amanda)."""
import io,json,hashlib,pathlib,time,urllib.parse,urllib.request,sys
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((root/'tools'/'amanda-fotos-litoral-parana.json').read_text(encoding='utf8'))
target=root/'frontend'/'assets'/'reportagens'/'amanda-litoral-parana'
target.mkdir(parents=True,exist_ok=True)
report=[]
for item in items:
  name=item['filename'].replace(' ','_')
  h=hashlib.md5(name.encode('utf-8')).hexdigest()
  path='https://upload.wikimedia.org/wikipedia/commons/thumb/'+h[0]+'/'+h[:2]+'/'+urllib.parse.quote(name)+'/1280px-'+urllib.parse.quote(name)
  api='https://commons.wikimedia.org/wiki/Special:Redirect/file/'+urllib.parse.quote(item['filename'])+'?width=1280'
  variants=[path,api]
  status={**item,'status':'error','tried':[]}
  for url in variants:
    try:
      req=urllib.request.Request(url,headers={'User-Agent':'EntreMaresEducationalProject/1.0 (school cultural research; Wikimedia Commons CC BY-SA attribution; contact GitHub repository henriquelima02-ship-it/entremares)','Accept':'image/jpeg,image/png,image/webp,image/*;q=0.8','Referer':'https://commons.wikimedia.org/'})
      with urllib.request.urlopen(req,timeout=28) as result:
        content=result.read(13000001)
      if len(content)>13000000:raise ValueError('Arquivo maior que 13 MB')
      image=Image.open(io.BytesIO(content));image.load();image=ImageOps.exif_transpose(image)
      if image.width<400 or image.height<300:raise ValueError('Imagem pequena para reportagem')
      image.thumbnail((1280,850),Image.Resampling.LANCZOS)
      if image.mode not in ('RGB','RGBA'):image=image.convert('RGB')
      image.save(target/(item['slug']+'.webp'),'WEBP',quality=84,method=5)
      file=target/(item['slug']+'.webp')
      status.update(status='ok',width=image.width,height=image.height,bytes=file.stat().st_size,downloaded_from=url)
      print('OK',item['slug'],image.width,image.height,flush=True)
      break
    except Exception as error:
      status['tried'].append(str(error)[:160])
      time.sleep(.4)
  if status['status']!='ok':print('FAILED',item['slug'],status['tried'],flush=True)
  report.append(status)
report_path=root/'docs'/'RELATORIO_FOTOS_AMANDA_PESCA_PARANA.json'
report_path.write_text(json.dumps({'images':report},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('TOTAL',sum(x['status']=='ok' for x in report),'/',len(report),flush=True)
if not any(x['status']=='ok' for x in report):sys.exit(1)
