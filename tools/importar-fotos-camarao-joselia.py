#!/usr/bin/env python3
"""Importa duas fotografias do camarão-branco para a capa escolar de Josélia."""
import io,json,pathlib,sys,urllib.parse,urllib.request
from PIL import Image,ImageOps,ImageFile
Image.MAX_IMAGE_PIXELS = 30000000
ImageFile.LOAD_TRUNCATED_IMAGES = False
root=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((root/'tools/fotos-camarao-branco-joselia.json').read_text(encoding='utf8'))
out=root/'frontend/assets/atividades/camarao-branco'
out.mkdir(parents=True,exist_ok=True)
report=[]
for item in items:
    url=item['url']
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36','Referer':'https://fishcode.com.br/','Accept':'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8','Accept-Language':'pt-BR,pt;q=0.9'})
    result={**item}
    try:
        with urllib.request.urlopen(req,timeout=35) as resp:
            data=resp.read(13000001)
        if len(data)>13000000:raise ValueError('Tamanho acima de 13 MB')
        im=Image.open(io.BytesIO(data));im.load();im=ImageOps.exif_transpose(im)
        if im.width<250 or im.height<250:raise ValueError('Resolução insuficiente')
        im.thumbnail((1200,1000),Image.Resampling.LANCZOS)
        if im.mode not in ('RGB','RGBA'):im=im.convert('RGB')
        filepath=out/item['file']
        im.save(filepath,'WEBP',quality=83,method=5)
        result.update(status='ok',width=im.width,height=im.height,size_bytes=filepath.stat().st_size)
        print('OK',item['id'],im.size,filepath.stat().st_size,flush=True)
    except Exception as exc:
        result.update(status='failed',error=str(exc)[:220])
        print('FAILED',item['id'],str(exc)[:220],flush=True)
    report.append(result)
(root/'docs/RELATORIO_FOTOS_CAMARAO_BRANCO_JOSELIA.json').write_text(json.dumps({'items':report},indent=2,ensure_ascii=False)+'\n',encoding='utf8')
count=sum(x['status']=='ok' for x in report)
print('TOTAL',count,'/',len(report),flush=True)
if count!=len(report):sys.exit(1)
