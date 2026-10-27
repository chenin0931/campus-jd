# OPPO careers.oppo.com：POST /openapi/position/pageNew 全量（应届生/博士生→校招，实习生→实习）
import json,re,collections
from morelib import post,cls,rec
d=post('https://careers.oppo.com/openapi/position/pageNew',{"pageNum":1,"pageSize":1000})['data']
R=d['records'];assert len(R)==d['total'],(len(R),d['total'])
out=[]
for x in R:
  c=cls(x['positionName'])
  if not c:continue
  jt='实习' if x['recruitmentType']=='Intern' or '实习' in x['recruitmentTypeName'] else '校招'
  req=((x.get('positionDesc') or '')+'\n'+(x.get('positionRequire') or '')).strip()
  out.append(rec('OPPO',x['positionName'],c,[s for s in re.split('[,，、]',x.get('workCityName') or '') if s],req,f"https://careers.oppo.com/university/oppo/campus/post/{x['idRecruitPosition']}",jt))
json.dump(out,open('../../staging/2026-W44/oppo.json','w'),ensure_ascii=False,indent=1)
print('raw',len(R),'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
