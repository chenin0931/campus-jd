import json,re,subprocess,datetime,collections,math
now=datetime.datetime.now().astimezone().isoformat(timespec='seconds')
def post(u,b):
    for i in range(4):
        o=subprocess.run(['curl','-s','-m','60','-X','POST',u,'-H','Content-Type: application/json','-d',json.dumps(b)],capture_output=True,text=True).stdout
        try: return json.loads(o)
        except: pass
    return {}
def cls(t):
    h=re.sub(r'【[^】]*】|\[[^\]]*\]','',t);h=re.split(r'\s*[-—–]\s*',h)[0]
    if re.search(r'开发|研发|算法|工程师|测试|研究|设计',h):return None
    ai=re.search(r'AI|大模型|Agent|AIGC|智能',h,re.I)
    if '运营' in h: return '运营'
    if '产品' in h: return 'AI产品' if ai else '产品'
def rec(co,t,c,city,req,url,jt): return dict(company=co,title=t,category=c,city=city,requirements=req or '',deadline=None,apply_url=url,source_url=url,fetched_at=now,job_type=jt)
out={}
# kuaishou
L=[];p=1
while True:
    r=post('https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/simple',{"pageNum":p,"pageSize":100})['result'];L+=r['list']
    if p*100>=r['total']:break
    p+=1
print('ks projects',collections.Counter(x['recruitProjectCode'] for x in L),len(L))
out['kuaishou']=[rec('快手',x['name'],c,[d['name'] for d in x.get('workLocationDicts') or []],x.get('positionDemand'),f"https://campus.kuaishou.cn/#/campus/job-info/{x['id']}",'校招' if x['recruitProjectCode']=='schoolr' else '实习') for x in L if (c:=cls(x['name']))]
# xiaohongshu
L=[];p=1
while True:
    d=post('https://job.xiaohongshu.com/websiterecruit/position/pageQueryPosition',{"recruitType":"campus","pageNum":p,"pageSize":100})['data'];L+=d['list']
    if p>=d['totalPage']:break
    p+=1
print('xhs',collections.Counter(x['jobProjectName'] for x in L),len(L))
out['xiaohongshu']=[rec('小红书',x['positionName'],c,re.split('[，,]',x.get('workplace') or ''),x.get('qualification'),f"https://job.xiaohongshu.com/campus/position/{x['positionId']}",'实习' if ('实习' in x['positionName'] or '实习' in (x['jobProjectName'] or '')) else '校招') for x in L if (c:=cls(x['positionName']))]
# meituan
L=[]
for code,jt in [('1','校招'),('2','实习')]:
    p=1
    while True:
        d=post('https://zhaopin.meituan.com/api/official/job/getJobList',{"page":{"pageNo":p,"pageSize":50},"jobShareType":"1","keywords":"","cityList":[],"department":[],"jfJgList":[],"jobType":[{"code":code,"subCode":[]}],"typeCode":[],"specialCode":[]}).get('data') or {}
        for x in d.get('list') or []: x['_jt']=jt
        L+=d.get('list') or []
        if not d or p>=d['page']['totalPage']:break
        p+=1
    print('mt',code,len(L))
seen=set();mt=[]
for x in L:
    if x['jobUnionId'] in seen:continue
    seen.add(x['jobUnionId'])
    if (c:=cls(x['name'])): mt.append(rec('美团',x['name'],c,[y['name'] for y in x.get('cityList') or []],x.get('jobRequirement'),f"https://zhaopin.meituan.com/web/position/detail?jobUnionId={x['jobUnionId']}&highlightType=campus",x['_jt']))
out['meituan']=mt
for k,v in out.items():
    json.dump(v,open(f'/workspace/campus-jd/data/2026-W44/{k}.json','w'),ensure_ascii=False,indent=2)
    print(k,len(v),collections.Counter((x['job_type'],x['category']) for x in v))
