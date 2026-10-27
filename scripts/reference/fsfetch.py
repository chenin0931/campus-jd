import json,sys,urllib.request,http.cookiejar,collections,re,datetime
import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
now=datetime.datetime.now().astimezone().isoformat(timespec='seconds')
EX=re.compile(r'开发|研发|算法|工程师|测试|研究');AI=re.compile(r'AI|大模型|Agent|AIGC|智能',re.I)
def wb(w):return r'(^|[^A-Za-z])(?:%s)([^A-Za-z]|$)'%w
RULES=[('商务',re.compile('商务|'+wb('BD')+'|商业化|渠道|合作|招商|采购|供应链|投资|战略',re.I)),('市场',re.compile('市场|营销|品牌|公关|'+wb('PR')+'|广告|媒介|增长',re.I)),('销售',re.compile('销售|客户经理|大客户|售前|售后|客户成功|'+wb('KA'),re.I)),('设计',re.compile('设计|视觉|交互|'+wb('UI|UX')+'|美术|原画|动画|插画',re.I)),('职能',re.compile(wb('HR(?:BP)?')+'|人力|招聘|财务|会计|审计|税务|法务|律师|合规|风控|行政|秘书|助理|内控|IT支持',re.I))]
PFX=re.compile(r'^\s*(?:\d{2,4}届)?(?:校招|校园招聘|实习生?|日常实习|暑期实习|应届生?)\s*[-－–—]\s*')
from classify import classify  # CLASSIFIER.md 参考实现
co,base,wp,slug=sys.argv[1:5];PT=int(sys.argv[5]) if len(sys.argv)>5 else 6
# MODE: campus (default: only 校招/*), social_intern (社招 listings: keep 实习 only), text (no recruit_type: text rule, detail recruit_type first)
MODE=sys.argv[6] if len(sys.argv)>6 else 'campus'
COH=re.compile(r'校招|应届|(?:20)?2[5-9]届')
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
H={'Content-Type':'application/json','portal-channel':'saas-career','website-path':wp,'Referer':f'{base}/{wp}/position/list'}
def req(u,d=None,h={},m=None):
  return json.load(op.open(urllib.request.Request(base+u,json.dumps(d).encode() if d is not None else None,{**H,**h},method=m),timeout=40))
tok=req('/api/v1/csrf/token',{"portal_entrance":1})['data']['token'];T={'x-csrf-token':tok}
L=[];off=0
while True:
  d=req('/api/v1/search/job/posts',{"keyword":"","limit":100,"offset":off,"portal_type":PT},T)['data'];L+=d['job_post_list'];off+=100
  if off>=d['count']:break
rts=collections.Counter(((j.get('recruit_type') or {}).get('parent') or {}).get('name','')+'/'+(j.get('recruit_type') or {}).get('name','') for j in L)
# detail check
def detail(i):
  try: return (req(f'/api/v1/job/posts/{i}?portal_type=6&with_recommend=false',None,T,'GET').get('data') or {}).get('job_post_detail')
  except Exception: return None
def det(i):
  try: r=req(f'/api/v1/job/posts/{i}?portal_type=6&with_recommend=false',None,T,'GET');return bool((r.get('data') or {}).get('job_post_detail'))
  except Exception as e: return None
out=[];seen=set();rts_d=collections.Counter()
for j in L:
  if j['id'] in seen:continue
  seen.add(j['id']);rt=j.get('recruit_type') or {};par=(rt.get('parent') or {}).get('name') or ''; nm=rt.get('name') or ''
  if MODE=='social_intern':
    jt='实习' if ('实习' in nm or '实习' in j['title']) else None
  elif MODE=='text':
    jt=None
    if not (par or nm):
      d=detail(j['id']) or {};drt=d.get('recruit_type') or {}
      par=(drt.get('parent') or {}).get('name') or '';nm=drt.get('name') or ''
      if par or nm: rts_d[par+'/'+nm]+=1
    if par or nm:
      if '社招' in par+nm: jt='实习' if '实习' in nm+j['title'] else None
      else: jt='实习' if '实习' in nm+par else ('校招' if re.search('校|应届|毕业',nm+par) else None)
    else:
      txt=j['title']+' '+(j.get('description') or '')+' '+(j.get('requirement') or '')+' '+(d.get('description') or '')+' '+(d.get('requirement') or '')
      jt='实习' if '实习' in txt else ('校招' if COH.search(txt) else None)
  else:
    if '社招' in par or '社招' in nm: continue
    jt='实习' if '实习' in nm+par else ('校招' if ('校' in nm+par or '应届' in nm+par or '毕业' in nm+par) else None)
  if not jt: continue
  c=classify(j['title'])
  if not c:continue
  city=[x['name'] for x in (j.get('city_list') or [])]
  url=f"{base}/{wp}/position/{j['id']}/detail"
  out.append(dict(company=co,title=j['title'],category=c,city=city,requirements=j.get('requirement') or None,deadline=None,apply_url=url,source_url=url,fetched_at=now,job_type=jt,source='official-ats:feishu',link_status=None,_id=j['id']))
ok=None
if out:
  a=det(out[0]['_id']);b=det('7000000000000000001');ok=(a is True and b is False)
for r in out:
  if ok: r['link_status']='正常' if det(r['_id']) else '疑似下架'
  else: r['link_status']='链接待核'
  r.pop('_id')
json.dump(out,open(f'/workspace/campus-jd/staging/2026-W44/startups/{slug}.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(dict(co=co,raw=len(L),rt=rts,detail_ok=ok,kept=len(out),by=collections.Counter(r['job_type']+':'+r['category'] for r in out),ls=collections.Counter(r['link_status'] for r in out),detail_rt=rts_d),ensure_ascii=False))
