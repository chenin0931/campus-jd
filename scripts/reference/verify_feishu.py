"""飞书官网逐条详情校验：python3 verify_feishu.py file.json ...  写回 link_status（正常/疑似下架/链接待核）"""
import json,re,sys,urllib.request,http.cookiejar,collections
for f in sys.argv[1:]:
  L=json.load(open(f));st=collections.Counter();T={}
  for r in L:
    m=re.match(r'(https://[^/]+)/([^/]+)/position/(\d+)/detail',r['apply_url']);base,wp,i=m.groups()
    if (base,wp) not in T:
      op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
      H={'Content-Type':'application/json','portal-channel':'saas-career','website-path':wp,'Referer':f'{base}/{wp}/position/list'}
      tok=json.load(op.open(urllib.request.Request(base+'/api/v1/csrf/token',b'{"portal_entrance":1}',H),timeout=40))['data']['token']
      def det(j,op=op,H={**H,'x-csrf-token':tok},base=base):
        try: return bool((json.load(op.open(urllib.request.Request(f'{base}/api/v1/job/posts/{j}?portal_type=6&with_recommend=false',None,H),timeout=40)).get('data') or {}).get('job_post_detail'))
        except Exception: return None
      T[(base,wp)]=(det,det('7000000000000000001') is False)
    det,ctrl=T[(base,wp)];ok=det(i)
    r['link_status']=('正常' if ok else '疑似下架') if ctrl and ok is not None else '链接待核';st[r['link_status']]+=1
  json.dump(L,open(f,'w'),ensure_ascii=False,indent=1);print(f,len(L),dict(st))
