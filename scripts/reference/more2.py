import json,re,subprocess,datetime,collections
from morelib import cls,rec,post
def form(u,d):
    for i in range(4):
        o=subprocess.run(['curl','-s','-m','60','-X','POST',u,'-H','Referer: https://talent.baidu.com/jobs/list','-H','Origin: https://talent.baidu.com','-H','User-Agent: Mozilla/5.0','-d',d],capture_output=True,text=True).stdout
        try: return json.loads(o)
        except: pass
out={}
L=[];p=1
while True:
    b=post('https://campus.jd.com/api/wx/position/page?type=present',{"pageSize":10,"pageIndex":p,"parameter":{"positionName":"","planIdList":[],"jobDirectionCodeList":[],"workCityCodeList":[],"positionDeptList":[]}})['body'];L+=b['items']
    if p*10>=b['totalNumber']:break
    p+=1
def jdcity(x):
    s=set()
    for r in x.get('requirementVoList') or []:
        for k in ('workCity',):
            v=r.get(k)
            if isinstance(v,str) and v: s|=set(re.split('[,，、]',v))
            elif isinstance(v,list): s|={c if isinstance(c,str) else c.get('name','') for c in v}
    return sorted(s-{''})
print('jd raw',len(L),L[0]['requirementVoList'][:1])
out['jd']=[rec('京东',x['positionName'],c,jdcity(x),x.get('qualification'),f"https://campus.jd.com/#/details?id={x['publishId']}",'实习' if '实习' in x['positionName'] else '校招') for x in L if (c:=cls(x['positionName']))]
B=[]
for rt,jt in [('GRADUATE','校招'),('INTERN','实习')]:
    p=1
    while True:
        d=form('https://talent.baidu.com/httservice/getPostListNew',f'recruitType={rt}&pageSize=10&curPage={p}&keyWord=')['data']
        for x in d['list']: x['_jt']=jt;x['_rt']=rt
        B+=d['list']
        if p*10>=int(d['total']):break
        p+=1
print('baidu raw',len(B))
def bt(n): return re.sub(r'^[^-]{1,6}-','',re.sub(r'[（(]J\d+[)）]','',n))
out['baidu']=[rec('百度',x['name'],c,(x.get('workPlace') or '').split(','),x.get('serviceCondition'),f"https://talent.baidu.com/jobs/detail/{x['_rt']}/{x['postId']}",x['_jt']) for x in B if (c:=cls(bt(x['name'])))]
for k,v in out.items():
    json.dump(v,open(f'/workspace/campus-jd/data/2026-W44/{k}.json','w'),ensure_ascii=False,indent=2)
    print(k,len(v),collections.Counter((x['job_type'],x['category']) for x in v),[x['title'] for x in v[:4]],v[0]['city'] if v else '')
