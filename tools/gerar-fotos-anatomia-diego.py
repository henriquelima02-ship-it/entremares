#!/usr/bin/env python3
"""Fotos que retratam a AÇÃO descrita e recortes anatômicos em PNG, com fontes CC."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import io, json, hashlib, urllib.request, urllib.parse, time, sys
root = Path(__file__).resolve().parents[1]
out = root / "frontend/assets/reportagens/diego-fotos-precisas"
out.mkdir(parents=True,exist_ok=True)
report={"anatomy":[],"photos":[]}

def get_commons(filename,width=960):
    fn = filename.replace(" ","_")
    hashcode=hashlib.md5(fn.encode("utf-8")).hexdigest()
    enc=urllib.parse.quote(fn,safe="()")
    urls=[
      "https://upload.wikimedia.org/wikipedia/commons/thumb/"+hashcode[0]+"/"+hashcode[:2]+"/"+enc+"/"+str(width)+"px-"+enc,
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/"+urllib.parse.quote(filename)+"?width="+str(width),
      "https://upload.wikimedia.org/wikipedia/commons/"+hashcode[0]+"/"+hashcode[:2]+"/"+enc
    ]
    problems=[]
    for url in urls:
      try:
        req=urllib.request.Request(url,headers={"User-Agent":"EntreMares/1.0 (educational project; images CC credited; github.com/henriquelima02-ship-it/entremares)","Accept":"image/jpeg,image/png,image/webp,image/*;q=0.8","Referer":"https://commons.wikimedia.org/"})
        with urllib.request.urlopen(req,timeout=33) as resp:data=resp.read(20000001)
        if len(data)>20000000:raise ValueError("larger than 20 MB")
        im=Image.open(io.BytesIO(data));im.load()
        if min(im.size)<240:raise ValueError("low resolution "+str(im.size))
        return ImageOps.exif_transpose(im.convert("RGB")),url
      except Exception as e:problems.append(str(e)[:100]);time.sleep(.3)
    raise RuntimeError(filename+" : "+" ; ".join(problems))

anatomy_source="1105 Anterior View of Muscles High-Res.png"
anatomy,origin=get_commons(anatomy_source,960)
# Anatomical coordinates from the OpenStax front-view image, relative to the source image.
boxes={
 "ombros":(.23,.155,.77,.31),
 "bracos":(.08,.23,.41,.44),
 "punhos":(.02,.465,.25,.64),
 "tronco":(.32,.30,.68,.52),
 "coxas":(.33,.47,.70,.74),
 "tornozelos":(.33,.80,.70,.985),
 "panturrilhas":(.34,.70,.70,.91)
}
W,H=anatomy.size
for name,ratios in boxes.items():
    x0,y0,x1,y1=ratios
    crop=anatomy.crop((int(W*x0),int(H*y0),int(W*x1),int(H*y1)))
    crop.thumbnail((236,236),Image.Resampling.LANCZOS)
    canvas=Image.new("RGB",(256,256),"#f2f8f3")
    canvas.paste(crop,((256-crop.width)//2,(256-crop.height)//2))
    target=out/(name+".png")
    canvas.save(target,optimize=True)
    report["anatomy"].append({"name":name,"file":str(target.relative_to(root)),"bytes":target.stat().st_size,"source":anatomy_source,"source_url":"https://commons.wikimedia.org/wiki/File:1105_Anterior_View_of_Muscles_High-Res.png","license":"CC BY 4.0","author":"OpenStax","crop":ratios})
    print("PNG",name,target.stat().st_size,flush=True)

photos=[
 {"name":"arremesso-tarrafa","filename":"Pescador e a tarrafa.jpg","place":"Baía da Babitonga, Santa Catarina","author":"Chrisporto","license":"CC BY-SA 3.0"},
 {"name":"puxada-rede","filename":"Pesca Artesanal no Rio São Francisco.jpg","place":"Januária, Minas Gerais","author":"Luiz Claudio Rios Pecoraro","license":"CC BY-SA 4.0"},
 {"name":"trapiche-passarela","filename":"RenatoSoares TrapicheDeBrasilia Paranagua PR (39239957870).jpg","place":"Ilha do Mel, Paranaguá, Paraná","author":"Renato Soares","license":"Confirmar metadados do Commons"}
]
for p in photos:
    try:
      im,url=get_commons(p["filename"],1200)
    except Exception as e:
      if p["name"]!="trapiche-passarela":raise
      p["filename"]="Trapiche de Paranaguá - panoramio.jpg"
      p["place"]="Paranaguá, Paraná"
      p["author"]="Arquivo Wikimedia Commons / Panoramio"
      im,url=get_commons(p["filename"],1200)
    im.thumbnail((1200,850),Image.Resampling.LANCZOS)
    dest=out/(p["name"]+".webp")
    im.save(dest,"WEBP",quality=82,method=5)
    p["file"]=str(dest.relative_to(root))
    p["downloaded_from"]=url
    p["width"],p["height"]=im.size
    p["bytes"]=dest.stat().st_size
    report["photos"].append(p)
    print("WEBP",p["name"],im.size,dest.stat().st_size,flush=True)
(root/"docs/RELATORIO_IMAGENS_DIEGO_CORRIGIDAS.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
print("DONE",len(report["anatomy"]),len(report["photos"]),flush=True)
