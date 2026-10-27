# 滴滴 official campus site = campus.didiglobal.com (Moka-hosted on Didi's own domain, linked from talent.didiglobal.com/campus).
# Response body is AES-CBC encrypted with the per-response key in "necromancer" (the page's own JS decrypts it the same way).
import json,base64,subprocess,time,collections
from cryptography.hazmat.primitives.ciphers import Cipher,algorithms,modes
from morelib import cls,rec
H='https://campus.didiglobal.com'
def jobs(off,site=96064,host=H):
    for i in range(4):
        try:
            o=subprocess.run(['curl','-s','-m','60','-X','POST',host+'/api/outer/ats-apply/website/jobs/v2','-H','Content-Type: application/json','-A','Mozilla/5.0','-d',json.dumps({"limit":50,"offset":off,"siteId":site,"orgId":"didiglobal","site":"campus","needStat":True})],capture_output=True,text=True).stdout
            d=json.loads(o);k=d['necromancer'].encode()
            dec=Cipher(algorithms.AES(k),modes.CBC(k)).decryptor();p=dec.update(base64.b64decode(d['data']))+dec.finalize()
            p=p[:-p[-1]].decode('utf-8','ignore');s=p[p.index('"data":'):]
            return json.loads('{'+s)['data']
        except Exception as e: err=e;time.sleep(3)
    raise err
L=[];off=0
while True:
    d=jobs(off);L+=d['jobs'];off+=50
    if off>=d['jobStats']['total']:break
I=[];off=0
while True:
    d=jobs(off,6222,'https://app.mokahr.com');I+=d['jobs'];off+=50
    if off>=d['jobStats']['total']:break
I=[x for x in I if '实习' in x['title']]
print('intern-site jobs with 实习 in title:',len(I))
json.dump(L+I,open('dd_raw.json','w'),ensure_ascii=False)
print(len(L),{k:str(v)[:60] for k,v in L[0].items()})
import re
out=[]
for x in L:
    t=x['title'];h=re.sub(r'^\d+届(秋招|春招|实习|暑期实习)?-','',t)
    if (c:=cls(h)):
        out.append(rec('滴滴',t,c,[l.get('cityName') or l.get('address') or '' for l in x.get('locations') or []],x.get('jobDescription'),f"{H}/campus_apply/didiglobal/96064#/job/{x['id']}",'实习' if '实习' in x['projectFolder']['name']+t else '校招'))
for x in I:
    t=x['title'];h=re.sub(r'^[^-（(]*?(事业群|BG|Fintech)[^-]*-','',t)
    if (c:=cls(h)):
        out.append(rec('滴滴',t,c,[l.get('cityName') or l.get('address') or '' for l in x.get('locations') or []],x.get('jobDescription'),f"https://app.mokahr.com/apply/didiglobal/6222#/job/{x['id']}",'实习'))
print(len(out),collections.Counter((r['job_type'],r['category']) for r in out))
json.dump(out,open('../../staging/2026-W44/didi.json','w'),ensure_ascii=False,indent=1)
