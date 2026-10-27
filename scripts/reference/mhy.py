# 米哈游 jobs.mihoyo.com（ats.openout.mihoyo.com/ats-portal）：校招 + 实习生专项
import json,collections
from morelib import post,cls,rec
B='https://ats.openout.mihoyo.com/ats-portal'
L=[];p=1
while True:
  d=post(B+'/v1/job/list',{"pageNo":p,"pageSize":100,"channelDetailIds":[1],"hireType":1})['data'];L+=d['list']
  if p*100>=int(d['total']):break
  p+=1
print('raw',len(L),collections.Counter((x['jobNature'],x['projectName']) for x in L))
out=[]
for j in L:
  c=cls(j['title'])
  if not c: continue
  det=post(B+'/v1/job/info',{"id":j['id'],"channelDetailIds":[1],"hireType":1}).get('data') or {}
  req='岗位职责：\n'+(det.get('description') or '')+'\n任职要求：\n'+(det.get('jobRequire') or '')
  jt='实习' if j['jobNature']=='实习' else '校招'
  out.append(rec('米哈游',j['title'],c,[a['addressDetail'] for a in j.get('addressDetailList') or []],req,f"https://jobs.mihoyo.com/#/campus/position/{j['id']}",jt))
json.dump(out,open('../../staging/2026-W44/mihoyo.json','w'),ensure_ascii=False,indent=1)
print('kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
