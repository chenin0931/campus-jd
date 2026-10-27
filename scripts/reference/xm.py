import json,re,urllib.request,http.cookiejar,time,collections,datetime
from morelib import cls,rec
H='https://xiaomi.jobs.f.mioffice.cn'
cj=http.cookiejar.CookieJar();op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def post(u,d,h={}):
    r=urllib.request.Request(H+u,json.dumps(d).encode(),{'Content-Type':'application/json','portal-channel':'saas-career','website-path':'campus','Referer':H+'/campus/position',**h})
    for i in range(5):
        try: return json.load(op.open(r,timeout=60))
        except Exception as e: time.sleep(3)
tok=post('/api/v1/csrf/token',{"portal_entrance":1})['data']['token']
L=[];off=0
while True:
    d=post('/api/v1/search/job/posts',{"keyword":"","limit":100,"offset":off,"portal_type":6},{'x-csrf-token':tok})['data'];L+=d['job_post_list']
    off+=100
    if off>=d['count']:break
print(len(L),d['count']);print({k:str(v)[:80] for k,v in L[0].items() if k not in('description','requirement')})
print(collections.Counter(str((x.get('recruit_type') or {}).get('name'))+'/'+str(((x.get('recruit_type') or {}).get('parent') or {}).get('name')) for x in L))
json.dump(L,open('xm_raw.json','w'),ensure_ascii=False)
