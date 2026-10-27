import json,urllib.request,collections,re
from morelib import cls,rec
H={'User-Agent':'Mozilla/5.0'};B='https://talent.lenovo.com.cn/gateway/jobBase/list'
g=lambda u:json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=60))['result']
# 城市字典: GET /gateway/sysDict/all -> dictCode=city_portal (dictValue->dictName)
CITY={str(c['dictValue']):c['dictName'] for x in json.load(urllib.request.urlopen(urllib.request.Request('https://talent.lenovo.com.cn/gateway/sysDict/all',headers=H),timeout=60))['result'] if x['dictCode']=='city_portal' for c in x['children']}
out=[];raw=0
for t in (1,2,3):
  r=g(f'{B}?projectType={t}&pageNum=1&pageSize=500');L=r['rows'];assert len(L)==r['total'];raw+=len(L)
  for x in L:
    c=cls(x['jobName'])
    if not c:continue
    d=g(f"{B}?jobId={x['id']}")['rows'];assert len(d)==1 and d[0]['id']==x['id']
    req=re.sub('<[^>]+>','\n',d[0].get('jobRequirement') or '').strip()
    out.append(rec('联想',x['jobName'],c,[CITY.get(k.strip(),'未知代码'+k) for k in re.split('[,，]',str(x.get('workPlace') or '')) if k.strip()],req,f"https://talent.lenovo.com.cn/position/detail?id={x['id']}&projectType={t}",'实习' if t==2 else '校招'))
json.dump(out,open('../../staging/2026-W44/lenovo.json','w'),ensure_ascii=False,indent=1)
print('raw',raw,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out),[r['title'] for r in out])
