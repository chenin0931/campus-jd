# 携程 careers.ctrip.com：category=2 校招；category=1(社招列表) 中 kindName/标题含实习 → 实习
import json,re,collections
from morelib import post,cls,rec
U='https://careers.ctrip.com/api/hrrecruit/getJobAd'
def allj(cat):
  L=[];p=1
  while True:
    d=post(U,{"condition":{"fromId":[],"keyword":"","kind":[],"country":[],"city":[],"bucode":[],"jobFamilyCode":[],"category":cat,"jobFamilyGroupCode":[]},"pager":{"index":str(p),"size":"100"}})['retValue']
    L+=d['recruitJobAdList']
    if p*100>=d['total']:break
    p+=1
  return L
C=allj(2);S=allj(1)
print('campus',len(C),'social',len(S),collections.Counter(x.get('kindName') for x in S))
strip=lambda h:re.sub(r'<[^>]+>','\n',h or '').replace('&nbsp;',' ')
out=[]
for jt,L in [('校招',C),('实习',[x for x in S if '实习' in (x.get('kindName') or '')+x['jobTitle']])]:
  for j in L:
    t=re.sub(r'\(MJ\d+\)$','',j['jobTitle']).strip()
    c=cls(t)
    if not c: continue
    if jt=='校招' and '实习' in t: jt2='实习'
    else: jt2=jt
    out.append(rec('携程',t,c,[j.get('cityName')] if j.get('cityName') else [],'岗位职责：\n'+strip(j.get('duty'))+'\n任职要求：\n'+strip(j.get('requirements')),
      f"https://careers.ctrip.com/#/{'campus' if jt=='校招' else 'experienced'}/job-detail/{j['fromId']}",jt2))
json.dump(out,open('../../staging/2026-W44/ctrip.json','w'),ensure_ascii=False,indent=1)
print('kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
