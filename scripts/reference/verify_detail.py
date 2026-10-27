#!/usr/bin/env python3
"""Check every record's job id against the official single-job detail API.
Usage: python3 verify_detail.py ../../data/2026-W44/kuaishou.json [more files...]
Supports 快手/京东/美团/小红书/小米. Exit code 1 if any id is invalid."""
import json,re,sys,time,urllib.request,http.cookiejar
UA={'User-Agent':'Mozilla/5.0','Content-Type':'application/json'}
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def req(url,body=None,h={}):
    r=urllib.request.Request(url,json.dumps(body).encode() if body is not None else None,{**UA,**h})
    for i in range(4):
        try: return json.load(op.open(r,timeout=30))
        except Exception as e: err=e; time.sleep(2)
    raise err
def ks(u):
    i=re.search(r'job-info/(\d+)',u).group(1)
    d=req(f'https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/find?id={i}')
    r=d.get('result') or {}; return i,d.get('code')==0 and bool(r.get('name')),r.get('name'),r.get('positionStatusCode')
def jd(u):
    i=re.search(r'id=(\d+)',u).group(1)
    b=req(f'https://campus.jd.com/api/wx/position/detail/{i}',{}).get('body') or {}
    return i,bool(b.get('publishId') and b.get('positionName')),b.get('positionName'),None
def mt(u):
    i=re.search(r'jobUnionId=(\d+)',u).group(1)
    d=req('https://zhaopin.meituan.com/api/official/job/getJobDetail',{"jobUnionId":i,"jobShareType":"1"})
    x=d.get('data') or {}; return i,bool(x.get('name')),x.get('name'),x.get('jobStatus') or d.get('message')
def xhs(u):
    i=re.search(r'position/(\d+)',u).group(1)
    d=req(f'https://job.xiaohongshu.com/websiterecruit/position/queryPositionDetail?positionId={i}')
    x=d.get('data') or {}; return i,bool(d.get('success') and x.get('positionName')),x.get('positionName'),d.get('alertMsg')
XM={}
def xm(u):
    H='https://xiaomi.jobs.f.mioffice.cn'; h={'portal-channel':'saas-career','website-path':'campus','Referer':H+'/campus/position'}
    if 'tok' not in XM: XM['tok']=req(H+'/api/v1/csrf/token',{"portal_entrance":1},h)['data']['token']
    i=re.search(r'position/(\d+)',u).group(1)
    x=(req(f'{H}/api/v1/job/posts/{i}?portal_type=6',None,{**h,'x-csrf-token':XM['tok']}).get('data') or {}).get('job_post_detail') or {}
    return i,bool(x.get('title')),x.get('title'),None
F={'campus.kuaishou.cn':ks,'campus.jd.com':jd,'zhaopin.meituan.com':mt,'job.xiaohongshu.com':xhs,'mioffice.cn':xm}
bad=0
for f in sys.argv[1:]:
    recs=json.load(open(f)); n=0
    for r in recs:
        fn=next((v for k,v in F.items() if k in r['apply_url']),None)
        if not fn: print('unsupported',r['apply_url']); continue
        try: i,ok,name,st=fn(r['apply_url'])
        except Exception as e: print('ERROR',r['apply_url'],e); bad+=1; continue
        if not ok: n+=1; print('INVALID',i,r['title'],st)
        elif name.strip()!=r['title'].strip(): print('TITLE CHANGED',i,r['title'],'->',name)
        time.sleep(0.2)
    print(f'{f}: {len(recs)} checked, {n} invalid'); bad+=n
sys.exit(1 if bad else 0)
