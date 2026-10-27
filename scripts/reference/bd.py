import json,subprocess,datetime,re,urllib.request,http.cookiejar
cj=http.cookiejar.CookieJar();op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def post(u,d,h={}):
    r=urllib.request.Request(u,json.dumps(d).encode(),{'Content-Type':'application/json','portal-channel':'campus','website-path':'campus','Referer':'https://jobs.bytedance.com/campus/position',**h})
    import time
    for i in range(5):
        try: return json.load(op.open(r,timeout=60))
        except Exception as e: print('retry',e); time.sleep(3)
    raise SystemExit('fail')
tok=post('https://jobs.bytedance.com/api/v1/csrf/token',{"portal_entrance":1})['data']['token']
seen={};now=datetime.datetime.now().astimezone().isoformat(timespec='seconds')
kws={'AI产品':['AI产品','大模型产品','Agent产品','AIGC产品'],'产品':['产品经理'],'运营':['运营']}
for cat,ks in kws.items():
  for k in ks:
    off=0
    while True:
      d=post('https://jobs.bytedance.com/api/v1/search/job/posts',{"keyword":k,"limit":100,"offset":off,"portal_type":3},{'x-csrf-token':tok})['data']
      L=d['job_post_list']
      for j in L:
        t=j['title']
        if cat!='AI产品' and re.search(r'AI|大模型|Agent|AIGC|智能',t): c='AI产品' if '产品' in t else cat
        else: c=cat
        if c=='产品' and '产品' not in t: continue
        if c=='运营' and '运营' not in t: continue
        if c=='AI产品' and '产品' not in t and '运营' not in t: continue
        if j['id'] in seen: continue
        cities=[x['name'] for x in (j.get('city_list') or [])] or ([j['city_info']['name']] if j.get('city_info') else [])
        seen[j['id']]=dict(company='字节跳动',title=t,category=c,city=cities,requirements=j.get('requirement') or '',deadline=None,
          apply_url=f"https://jobs.bytedance.com/campus/position/{j['id']}/detail",source_url=f"https://jobs.bytedance.com/campus/position/{j['id']}/detail",fetched_at=now)
      off+=100
      if off>=d.get('count',0) or not L: break
json.dump(list(seen.values()),open('/workspace/campus-jd/data/2026-W44/bytedance.json','w'),ensure_ascii=False,indent=2)
from collections import Counter;print(len(seen),Counter(v['category'] for v in seen.values()))
