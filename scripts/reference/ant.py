import json,subprocess,re,datetime,collections
def s(p):
    o=subprocess.run(['curl','-s','-m','60','--retry','3','-b','ac.txt','-X','POST','https://hrcareersweb.antgroup.com/api/campus/position/search','-H','Content-Type: application/json','-H','Origin: https://talent.antgroup.com','-H','Referer: https://talent.antgroup.com/campus-list','-d',json.dumps({"pageIndex":p,"pageSize":20,"channel":"campus_group_official_site","language":"zh"})],capture_output=True,text=True).stdout
    return json.loads(o)
A=[];p=1
while True:
    r=s(p);L=r['content'] or [];A+=L
    if p==1: print({k:v for k,v in r.items() if k!='content'}); print({k:(str(v)[:60]) for k,v in L[0].items()})
    if len(L)<20: break
    p+=1
json.dump(A,open('antall.json','w'),ensure_ascii=False);print(len(A))
print(collections.Counter(x.get('batchName') or x.get('categoryType') for x in A))
