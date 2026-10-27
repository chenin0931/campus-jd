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
