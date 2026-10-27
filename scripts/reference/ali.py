import json,re,subprocess,datetime,collections
T=[l.split()[6] for l in open('ali.txt') if 'XSRF' in l][0]
def s(kw,p):
    o=subprocess.run(['curl','-s','-m','60','--retry','3','-b','ali.txt','-X','POST',f'https://campus-talent.alibaba.com/position/search?_csrf={T}','-H','Content-Type: application/json','-H',f'x-xsrf-token: {T}','-d',json.dumps({"language":"zh","key":kw,"pageIndex":p,"pageSize":100})],capture_output=True,text=True).stdout
    return json.loads(o)['content']
now=datetime.datetime.now().astimezone().isoformat(timespec='seconds');seen={};first=None
for kw in ['产品','运营','AI','策划']:
  p=1
  while True:
    c=s(kw,p);L=c['datas'] or []
    for j in L:
      first=first or j
      t=j['name'];h=re.split(r'\s*-\s*',t)[0]
      if re.search(r'开发|研发|算法|工程师|测试',h) or j['id'] in seen: continue
      ai=re.search(r'AI|大模型|Agent|AIGC|智能',h,re.I)
      if '产品' in h and '运营' not in h: cat='AI产品' if ai else '产品'
      elif '运营' in h: cat='运营'
      else: continue
      u=f"https://campus-talent.alibaba.com/campus/position/{j['id']}"
      seen[j['id']]=dict(company='阿里巴巴',title=t,category=cat,city=j.get('workLocations') or [],requirements=j.get('requirement') or '',deadline=None,
        apply_url=u,source_url=u,fetched_at=now,_raw=j)
    p+=1
    if (p-1)*100>=c['totalCount'] or not L: break
print({k:v for k,v in first.items() if k not in('requirement','description')})
json.dump(list(seen.values()),open('ali_raw.json','w'),ensure_ascii=False)
print(len(seen))
