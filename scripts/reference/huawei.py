# 华为 career.huawei.com 新站：POST apigw .../recruitmentPosition/pub/getJobPage，jobType=CR 为校园；recruitmentType=["INTERN"] 为实习
import json,subprocess,collections,time
from morelib import cls,rec
A='https://apigw-dgg-b0.huawei.com/api/apig/channelhw/recruitmentPosition/pub/getJobPage?X-HW-ID=app_000000035886'
H=['-A','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36','-H','Content-Type: application/json','-H','Origin: https://career.huawei.com','-H','Referer: https://career.huawei.com/cn/campus-recruitment-job-list','-H','x-language: zh_CN','-H','x-jalor-tenantAlias: hcm','-H','X-HW-ID: app_000000035886','-H','x-Referer: https://career.huawei.com/cn']
def q(b):
  for i in range(3):
    try:
      d=json.loads(subprocess.check_output(['curl','-s','-m','60','-X','POST',A,*H,'-d',json.dumps(b)]))
      if d.get('status')=='SUCCESS':return d['data']
    except Exception:pass
    time.sleep(2)
  raise SystemExit('fail '+json.dumps(b))
def allp(extra):
  R=[];p=1
  while True:
    d=q({"curPage":p,"pageSize":100,"jobType":"CR",**extra});R+=d['result']
    if len(R)>=d['pageVO']['totalRows'] or not d['result']:return R,d['pageVO']['totalRows']
    p+=1
out=[];stat={}
for rt,jt in [('FRESH_GRADUATE','校招'),('INTERN','实习')]:
  R,t=allp({"recruitmentType":[rt]});stat[rt]=(len(R),t)
  for x in R:
    c=cls(x['jobName'])
    if not c:continue
    req=((x.get('mainBusiness') or '')+'\n'+(x.get('jobRequire') or '')).strip()
    city=[s for s in (x.get('workPlace') or '').replace('，',',').split(',') if s]
    u=f"https://career.huawei.com/cn/job-details?advertisementId={x['advertisementId']}"
    out.append(rec('华为',x['jobName'],c,city,req,u,jt))
allR,allT=allp({});stat['CR_all']=(len(allR),allT)
json.dump(out,open('../../staging/2026-W44/huawei.json','w'),ensure_ascii=False,indent=1)
print(stat,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
