import json,re,urllib.request,datetime,time,collections
def get(u,d=None):
    for i in range(5):
        try:
            r=urllib.request.Request(u,json.dumps(d).encode() if d else None,{'Content-Type':'application/json'})
            return json.load(urllib.request.urlopen(r,timeout=60))['data']
        except Exception as e: time.sleep(3)
now=datetime.datetime.now().astimezone().isoformat(timespec='seconds');seen={};keys=set()
for kw in ['产品','运营','AI','策划']:
  p=1
  while True:
    d=get('https://join.qq.com/api/v1/position/searchPosition',{"projectIdList":[],"projectMappingIdList":[],"keyword":kw,"bgList":[],"workCountryType":0,"workCityList":[],"recruitCityList":[],"positionFidList":[],"pageIndex":p,"pageSize":100})
    L=d['positionList'] or []
    for j in L:
      t=j['positionTitle'];h=re.split(r'\s*-\s*',t)[0]
      if re.search(r'开发|研发|算法|工程师|测试',h) or j['postId'] in seen: continue
      ai=re.search(r'AI|大模型|Agent|AIGC|智能',h,re.I)
      if '产品' in h and '运营' not in h: c='AI产品' if ai else '产品'
      elif '运营' in h: c='运营'
      else: continue
      det=get('https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?postId='+j['postId']) or {};keys|=set(det)
      u='https://join.qq.com/post_detail.html?postid='+j['postId']
      seen[j['postId']]=dict(company='腾讯',title=t,category=c,city=(j['workCities'] or '').split(),requirements=det.get('request') or '',deadline=None,
        apply_url=u,source_url=u,fetched_at=now,job_type='实习' if '实习' in (j['projectName'] or '') else '校招',_proj=j['projectName'])
    p+=1
    if (p-1)*100>=d['count'] or not L: break
print(collections.Counter(v['_proj'] for v in seen.values()));print(sorted(keys))
for v in seen.values(): v.pop('_proj')
json.dump(list(seen.values()),open('/workspace/campus-jd/data/2026-W44/tencent.json','w'),ensure_ascii=False,indent=2)
print(len(seen),collections.Counter((v['job_type'],v['category']) for v in seen.values()))
