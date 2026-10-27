# 北森 zhiye 官网通用：python3 bs.py <公司> <host> <PortalId> <slug>
import json,sys,urllib.request,collections,time,re
from morelib import cls,rec
co,h,pid,slug=sys.argv[1:5]
PFX=re.compile(r'^\s*【[^】]*】')
def post(b):
  for i in range(5):
    try: return json.load(urllib.request.urlopen(urllib.request.Request(f'https://{h}/api/Jobad/GetJobAdPageList',json.dumps(b).encode(),{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}),timeout=60))
    except Exception as e: print('retry',e);time.sleep(3)
  raise SystemExit('fail')
L=[];pi=0
while True:
  d=post({"PageIndex":pi,"PageSize":100,"KeyWords":"","SpecialType":0,"PortalId":pid,"DisplayFields":["Category","Kind","LocId","ClassificationOne"]})
  L+=d['Data'];pi+=1
  if len(L)>=d['Count'] or not d['Data']:break
ids=[j['Id'] for j in L];assert len(ids)==len(set(ids))==d['Count'],(len(ids),d['Count'])
print(co,'raw',len(L),collections.Counter((j.get('Category'),j.get('Kind')) for j in L))
out=[]
for j in L:
  cat=j.get('Category') or ''
  if '社' in cat: continue
  t=j['JobAdName'];c=cls(t)
  if not c: continue
  intern=j.get('Kind')=='实习' or '实习' in cat
  city=[x.split('·')[-1] for x in (j.get('LocNames') or [])]
  out.append(rec(co,t,c,city,j.get('Require'),f"https://{h}/{'intern' if intern else 'campus'}/detail?jobAdId={j['Id']}",'实习' if intern else '校招'))
json.dump(out,open(f'../../staging/2026-W44/{slug}.json','w'),ensure_ascii=False,indent=1)
print(co,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
