# 飞书招聘 SaaS 官网通用抓取：python3 fsco.py <公司> <base> <website-path> <slug> [portal_type=6]
import json,sys,urllib.request,http.cookiejar,collections,time
from morelib import cls,rec
import re
PFX=re.compile(r'^\s*(?:\d{2,4}届)?(?:校招|校园招聘|实习生?|日常实习|暑期实习|应届生?)\s*[-－–—]\s*')
cls2=cls  # classify.py 已处理前缀
co,base,wp,slug=sys.argv[1:5];pt=int(sys.argv[5]) if len(sys.argv)>5 else 6
cj=http.cookiejar.CookieJar();op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
H={'Content-Type':'application/json','portal-channel':'saas-career','website-path':wp,'Referer':f'{base}/{wp}/position/list'}
def post(u,d,h={}):
  for i in range(5):
    try: return json.load(op.open(urllib.request.Request(base+u,json.dumps(d).encode(),{**H,**h}),timeout=60))
    except Exception as e: print('retry',e);time.sleep(3)
  raise SystemExit('fail')
tok=post('/api/v1/csrf/token',{"portal_entrance":1})['data']['token']
L=[];off=0
while True:
  d=post('/api/v1/search/job/posts',{"keyword":"","limit":100,"offset":off,"portal_type":pt},{'x-csrf-token':tok})['data']
  L+=d['job_post_list'];off+=100
  if off>=d['count']:break
print(co,'raw',len(L),collections.Counter((j.get('recruit_type') or {}).get('name') for j in L))
out=[]
for j in L:
  c=cls2(j['title'])
  if not c: continue
  rt=j.get('recruit_type') or {}
  par=(rt.get('parent') or {}).get('name') or ''
  jt='实习' if '实习' in (rt.get('name') or '') else ('社招' if '社招' in par else '校招')  # 社招原样保留，后处理再判
  city=[x['name'] for x in (j.get('city_list') or [])] or ([j['city_info']['name']] if j.get('city_info') else [])
  out.append(rec(co,j['title'],c,city,j.get('requirement'),f"{base}/{wp}/position/{j['id']}/detail",jt))
json.dump(out,open(f'../../staging/2026-W44/{slug}.json','w'),ensure_ascii=False,indent=1)
print(co,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
