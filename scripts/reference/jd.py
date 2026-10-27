# 京东 campus.jd.com：POST /api/wx/position/page?type=present|internship。pageIndex 从 0 开始（旧脚本从 1 开始→每类丢首页 10 条）。
import json,re,collections
from morelib import cls,rec,post
P={"positionName":"","planIdList":[],"jobDirectionCodeList":[],"workCityCodeList":[],"positionDeptList":[]}
def jdcity(x):
  s=set()
  for r in x.get('requirementVoList') or []:
    v=r.get('workCity')
    if isinstance(v,str) and v: s|=set(re.split('[,，、]',v))
    elif isinstance(v,list): s|={c if isinstance(c,str) else c.get('name','') for c in v}
  return sorted(s-{''})
out=[];st={}
for t,jt in [('present','校招'),('internship','实习')]:
  b=post(f'https://campus.jd.com/api/wx/position/page?type={t}',{"pageSize":1000,"pageIndex":0,"parameter":P})['body']
  L=b['items'];assert len(L)==b['totalNumber']==len({x['publishId'] for x in L}),(t,len(L),b['totalNumber']);st[t]=len(L)
  for x in L:
    c=cls(x['positionName'])
    if c: out.append(rec('京东',x['positionName'],c,jdcity(x),x.get('qualification'),f"https://campus.jd.com/#/details?id={x['publishId']}",jt))
json.dump(out,open('../../staging/2026-W44/jd.json','w'),ensure_ascii=False,indent=1)
print(st,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
