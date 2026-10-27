# 网易 official campus API (found in campus.163.com chunked JS: /api/campuspc/position/getJobList, GET)
import json,subprocess,time,collections
from morelib import cls,rec
P={103:('campus.163.com','校招','网易互联网'),102:('campus.game.163.com','校招','网易互娱'),75:('campus.game.163.com','实习','网易互娱'),104:('campus.game.163.com','校招','网易互娱')}
def get(u):
    for i in range(4):
        try: return json.loads(subprocess.run(['curl','-s','-m','60',u],capture_output=True,text=True).stdout)
        except Exception: time.sleep(2)
out=[];raw=0
for pid,(h,jt,bu) in P.items():
    p=1
    while True:
        d=get(f'https://{h}/api/campuspc/position/getJobList?projectId={pid}&currentPage={p}&pageSize=50')['data']
        for x in d['list']:
            raw+=1
            if (c:=cls(x['positionName'])):
                r=rec('网易',x['positionName'],c,[s for s in (x.get('workPlaceName') or '').split(',') if s],x.get('positionRequirement'),f"https://{h}/app/detail/index?id={x['id']}&projectId={pid}",jt)
                r['business_unit']=[bu]; out.append(r)
        if d.get('lastPage') or p>=d['pages']: break
        p+=1
print(raw,len(out),collections.Counter((r['job_type'],r['category']) for r in out))
json.dump(out,open('../../data/2026-W44/netease.json','w'),ensure_ascii=False,indent=1)
# 日常实习 (navigation link hr.163.com/job-list.html?workType=1) -> POST hr.163.com/api/hr163/position/queryPage
p=1;n0=len(out)
while True:
    o=subprocess.run(['curl','-s','-m','60','-X','POST','https://hr.163.com/api/hr163/position/queryPage','-H','Content-Type: application/json','-d',json.dumps({"currentPage":p,"pageSize":100,"workType":"1"})],capture_output=True,text=True).stdout
    d=json.loads(o)['data']
    for x in d['list']:
        if (c:=cls(x['name'])):
            r=rec('网易',x['name'],c,x.get('workPlaceNameList') or [],x.get('requirement'),f"https://hr.163.com/job-detail.html?id={x['id']}",'实习'); r['business_unit']=[x.get('productName') or x.get('firstDepName') or '网易']; out.append(r)
    if p>=d['pages']:break
    p+=1
print('daily interns kept',len(out)-n0,collections.Counter((r['job_type'],r['category']) for r in out))
json.dump(out,open('../../data/2026-W44/netease.json','w'),ensure_ascii=False,indent=1)
