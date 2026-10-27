# 哔哩哔哩 jobs.bilibili.com：先 GET /api/auth/v1/csrf/token（站点自身前端头 X-AppKey: ops.ehr-api.auth, X-UserType: 2），
# 再 POST /api/campus/position/positionList（带 X-CSRF）。positionTypeName 全职→校招，实习→实习
import json,re,subprocess,collections
from morelib import cls,rec
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
B='https://jobs.bilibili.com'
base=['curl','-s','-m','60','--retry','3','-A',UA,'-H','X-AppKey: ops.ehr-api.auth','-H','X-UserType: 2','-H','Origin: '+B,'-H','Referer: '+B+'/campus/positions']
t=json.loads(subprocess.check_output(base+[B+'/api/auth/v1/csrf/token']))['data']
d=json.loads(subprocess.check_output(base+['-H','X-CSRF: '+t,'-H','Content-Type: application/json','-X','POST',B+'/api/campus/position/positionList','-d',json.dumps({"pageSize":2000,"pageNum":1})]))
assert d['code']==0,d
L=d['data']['list'];assert len(L)==d['data']['total'],(len(L),d['data']['total'])
out=[]
for x in L:
  c=cls(x['positionName'])
  if not c:continue
  jt='实习' if x.get('positionTypeName')=='实习' else '校招'
  req=re.sub(r'<[^>]+>','',x.get('positionDescription') or '').strip()
  city=[s for s in re.split('[/,，、]',x.get('workLocation') or '') if s]
  out.append(rec('哔哩哔哩',x['positionName'],c,city,req,f"{B}/campus/positions/{x['id']}",jt))
json.dump(out,open('../../staging/2026-W44/bilibili.json','w'),ensure_ascii=False,indent=1)
print('raw',len(L),collections.Counter(x.get('positionTypeName') for x in L),'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
