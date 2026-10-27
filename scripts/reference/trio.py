import json,urllib.request,collections,time,re,sys
from morelib import cls,rec
PFX=re.compile(r'^\s*(?:\d{2,4}届)?(?:校招|校园招聘|实习生?|日常实习|暑期实习|应届生?)\s*[-－–—]\s*')
c2=lambda t:cls(PFX.sub('',t))
UA={'User-Agent':'Mozilla/5.0','Content-Type':'application/json'}
def get(u,d=None,h=UA):
  for i in range(4):
    try:return json.load(urllib.request.urlopen(urllib.request.Request(u,d,h),timeout=60))
    except Exception as e: time.sleep(3);err=e
  raise err
st='../../staging/2026-W44/'
def save(slug,out,raw):
  json.dump(out,open(st+slug+'.json','w'),ensure_ascii=False,indent=1)
  print(slug,'raw',raw,'kept',len(out),collections.Counter((r['job_type'],r['category']) for r in out))
w=sys.argv[1]
if w=='tme':
  L=[];T={'10':'校招','20':'实习','30':'实习','40':'校招'}
  for t in T:
    d=get('https://join.tencentmusic.com/api/uc-job/list',json.dumps({"page":1,"ss":500,"type":t,"job_class":[],"work_city":"","setid":"","keyword":""}).encode())['data']
    assert len(d['items'])==int(d['_meta']['total_count']),t
    L+=[(x,T[t]) for x in d['items']]
  out=[];seen=set()
  for x,jt in L:
    c=c2(x['name'])
    if not c or (x['id'],jt) in seen:continue
    seen.add((x['id'],jt));info=get(f"https://join.tencentmusic.com/api/uc-job/info?id={x['id']}")
    assert str(info['code'])=='200',x['id']
    dd=info['data'];req=dd.get('requirement') or dd.get('require') or ''
    out.append(rec('腾讯音乐',x['name'],c,'/'.join(k['label'] for k in x['work_city']),req,f"https://join.tencentmusic.com/campus/post-details/?id={x['id']}",jt))
  save('tme',out,len(L))
if w=='lixiang':
  B='https://www.lixiang.com/osd-hr-recruitment-website/v1/recruit/'
  d=get(B+'school/job-page?page=1&page_size=2000',h={'User-Agent':'Mozilla/5.0'})['data']
  L=d['items'];assert len(L)==d['total_count']==len({x['id'] for x in L})
  print(collections.Counter(x['job_mode_name'] for x in L))
  out=[]
  for x in L:
    c=c2(x['title'])
    if not c:continue
    dd=get(B+f"job/detail?job_id={x['id']}",h={'User-Agent':'Mozilla/5.0'});assert dd['code']==0,x['id']
    jt='实习' if '实习' in x['job_mode_name'] or '实习' in (dd['data'].get('subject_name') or '') else '校招'
    req=re.sub('<[^>]+>','\n',dd['data'].get('requirements') or '').strip()
    out.append(rec('理想汽车',x['title'],c,x['location_title'],req,f"https://www.lixiang.com/employ/detail/{x['id']}.html?jobCode={x['code']}",jt))
  save('lixiang',out,len(L))
if w=='honor':
  L=json.load(open('/tmp/hon_e4d4e_1.json'.replace('e4d4e','2d4e')));S='SU60eea919bef57c1023f6fe78'
  out=[]
  for x in L:
    c=c2(x['postName'])
    if not c:continue
    u=f'https://career.honor.com/wecruit/positionInfo/listPositionDetail/{S}?iSaJAx=isAjax&request_locale=zh_CN'
    dd=get(u,f"postId={x['postId']}&recruitType=1".encode(),{'User-Agent':'Mozilla/5.0','Content-Type':'application/x-www-form-urlencoded'})
    assert dd.get('state')=='200',(x['postId'],str(dd)[:200])
    req=(dd['data'].get('serviceCondition') or '')
    out.append(rec('荣耀',x['postName'],c,x.get('workPlaceStr') or '',req,f"https://career.honor.com/{S}/pb/posDetail.html?postId={x['postId']}&postType=campus",'校招'))
  save('honor',out,len(L))
