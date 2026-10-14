#!/usr/bin/env python3
"""Restaurar el sitio completo del 9-10-2026 y conservar la directiva del 14."""
from pathlib import Path
import re
from urllib.request import urlopen
ORIGIN="https://sky-fc-7umxmaxj5-chatigpt2k25-7838.vercel.app/"
FAVICON="https://sky-fc-kn88ss2m0-chatigpt2k25-7838.vercel.app/"
def get(path):
    with urlopen((FAVICON if path in ("favicon.ico","favicon.png") else ORIGIN)+path,timeout=30) as r:
        assert r.status == 200, path
        return r.read()
def between(s,a,b):
    i=s.index(a);j=s.index(b,i+len(a))
    return s[i:j]
def substitute(s,a,b,val):
    i=s.index(a);j=s.index(b,i+len(a))
    return s[:i]+val+s[j:]
p=Path("index.html")
current=p.read_text(encoding="utf-8")
old=get("index.html").decode("utf-8")
assert len(old)>500000 and 'id="fan-email-form"' in old and 'id="fan-wa-link"' in old
assert '<section id="directiva">' in current and "Pedro Miguel Ruiz Richart" in current
old=old.replace("</style>",between(current,"/* Junta directiva de SKY FC */","</style>")+"</style>",1)
old=substitute(old,'<section id="organigrama">','<section id="lesiones">',between(current,'<section id="directiva">','<section id="lesiones">'))
old=substitute(old,"  leadership: [","  injuries: [",between(current,"  board: [","  injuries: ["))
old=substitute(old,"function renderLeadership(){","function renderInjuries(){",between(current,"function renderBoard(){","function renderInjuries(){"))
old=old.replace("renderLeadership();","renderBoard();")
item=between(current,'    {\n      date: "2026-10-14",','    {\n      date: "2026-10-06",')
old=old.replace("  news: [\n","  news: [\n"+item,1)
for title in ("Sergio Requena continuará únicamente como delegado","Estructura oficial del SKY FC"):
    pat=r'    \{\n      date: "[^"]+",\n      title: "'+re.escape(title)+r'",[\s\S]*?    \},\n'
    old,n=re.subn(pat,"",old,count=1)
    assert n==1,title
if 'href="#suscripciones"' not in old:
    old=old.replace('      <a href="#club">Club</a>','      <a href="#suscripciones">Suscripciones</a>\n      <a href="#club">Club</a>',1)
for needle in ("Pedro Miguel Ruiz Richart","Alejandro Ortega Mendoza","Asier González Sánchez",
               "Sergio Requena Megias",'id="fan-email-form"','id="fan-wa-link"',
               'id="fan-push-button"','<section id="directiva">',"suscripciones.js"):
    assert needle in old,needle
p.write_text(old,encoding="utf-8")
files=["suscripciones.js","confirmada.html","privacidad.html","OneSignalSDKWorker.js",
       "escudo-oficial-skyfc.webp","favicon.ico","favicon.png",
       "googlee2f68416eda4e20c.html","robots.txt","sitemap.xml"]
for f in files:
    data=get(f)
    assert len(data)>20,f
    Path(f).write_bytes(data)
print(f"Web recuperada: {len(old)} caracteres y {len(files)} recursos, sin perder los cargos de la directiva.")
