# vivo hr-campus.vivo.com（北森）：POST /api/Jobad/GetJobAdPageList（校园招聘→校招，实习生招聘→实习）
import json,collections
from morelib import post,cls,rec
P='903cbcbf-4898-46e1-817c-da522a9752b1'
d=post('https://hr-campus.vivo.com/api/Jobad/GetJobAdPageList',{"PageIndex":0,"PageSize":1000,"KeyWords":"","SpecialType":0,"PortalId":P,"DisplayFields":["Category","Kind","LocId","ClassificationOne"]})
R=d['Data'];assert len(R)==d['Count'],(len(R),d['Count'])
print('raw',len(R),collections.Counter(x['Category'] for x in R))
out=[]
for x in R:
  c=cls(x['JobAdName'])
  if not c:continue
  intern='实习' in (x['Category'] or '')
  out.append(rec('vivo',x['JobAdName'],c,[l.split('·')[-1] for l in x.get('LocNames') or []],
    '岗位职责：\n'+(x.get('Duty') or '')+'\n任职要求：\n'+(x.get('Require') or ''),
    f"https://hr-campus.vivo.com/{'intern' if intern else 'campus'}/detail?jobAdId={x['Id']}",'实习' if intern else '校招'))
json.dump(out,open('../../staging/2026-W44/vivo.json','w'),ensure_ascii=False,indent=1)
print('kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
