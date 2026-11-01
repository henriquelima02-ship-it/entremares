#!/usr/bin/env python3
"""Importação pontual das referências de pescados autorizadas pelo curador do projeto."""
import io, json, pathlib, sys, urllib.request, urllib.parse, datetime
from PIL import Image, ImageOps, UnidentifiedImageError
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/"tools"/"pescados-import-urls.json").read_text(encoding="utf8"))
dest=ROOT/"frontend"/"assets"/"pescados"/"referencias"
dest.mkdir(parents=True,exist_ok=True)
report=[]
Image.MAX_IMAGE_PIXELS=22_000_000
for item in manifest:
    row={"id":item["id"],"name":item["name"],"credit":item["source"],"source_host":urllib.parse.urlsplit(item["url"]).hostname,"status":"failed"}
    try:
        request=urllib.request.Request(item["url"],headers={
            "User-Agent":"Mozilla/5.0 (compatible; EntreMares/1.0; educational image curation)",
            "Accept":"image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.1",
            "Referer": ("https://www.google.com/" if "gstatic.com" in item["url"] else urllib.parse.urlsplit(item["url"]).scheme+"://"+urllib.parse.urlsplit(item["url"]).netloc+"/")
        })
        with urllib.request.urlopen(request,timeout=17) as res:
            content_type=res.headers.get("Content-Type","")
            data=res.read(9_000_001)
        if len(data)>9_000_000:raise ValueError("Imagem maior que 9 MB")
        im=Image.open(io.BytesIO(data))
        im.load()
        im=ImageOps.exif_transpose(im)
        if im.width < 70 or im.height < 70: raise ValueError("Imagem demasiado pequena")
        im.thumbnail((960,850),Image.Resampling.LANCZOS)
        if im.mode not in ("RGB","RGBA"): im=im.convert("RGB")
        output=dest/(item["id"]+".webp")
        im.save(output,"WEBP",quality=84,method=5)
        row.update(status="ok",file=str(output.relative_to(ROOT)),width=im.width,height=im.height,size=output.stat().st_size)
        print("OK",item["id"],im.size,output.stat().st_size,flush=True)
    except Exception as exc:
        row["error"]=str(exc)[:220]
        print("FAILED",item["id"],row["error"],flush=True)
    report.append(row)
out=ROOT/"docs"/"RELATORIO_IMPORTACAO_PESCADOS.json"
out.write_text(json.dumps({"generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"items":report},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("RESULTADOS",sum(r["status"]=="ok" for r in report),"/",len(report),flush=True)
if not any(r["status"]=="ok" for r in report):sys.exit(2)
