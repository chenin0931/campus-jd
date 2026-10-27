import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import json,re,subprocess,datetime,collections,math
now=datetime.datetime.now().astimezone().isoformat(timespec='seconds')
def post(u,b):
    for i in range(4):
        o=subprocess.run(['curl','-s','-m','60','-X','POST',u,'-H','Content-Type: application/json','-d',json.dumps(b)],capture_output=True,text=True).stdout
        try: return json.loads(o)
        except: pass
    return {}
# 抓取阶段不做任何过滤/分类（运营助手 2026-10-27）：分类+排除+job_type 只在 scripts/lib/common.js classify() 后处理
cls=lambda t:'待分类'
def rec(co,t,c,city,req,url,jt): return dict(company=co,title=t,category=c,city=city,requirements=req or '',deadline=None,apply_url=url,source_url=url,fetched_at=now,job_type=jt)
