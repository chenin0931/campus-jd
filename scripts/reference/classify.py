"""Python 版 CLASSIFIER.md 参考实现（与 §4 JS 等价）。所有 Python 抓取器从这里 import classify。"""
import re
EXCLUDE_ANY=re.compile(r'算法|工程师|开发|测试')
EXCLUDE=re.compile(r'研发|研究员|研究型|研究科学家|科研|课题|技术研究|数据工程|网络技术|数据中心技术|芯片|前端|后端|客户端|全栈|架构师|运维|(^|[^A-Za-z])(Engineer|SRE|Developer|Researcher)([^A-Za-z]|$)',re.I)
ROLE=re.compile(r'实习|工程师|经理|专员|主管|研究员|分析师|架构师|策划|运营|产品|设计|开发|研发|算法|测试|顾问|管培|培训生|助理|岗|师|Engineer|Manager|Intern',re.I)
AI=re.compile(r'AI|大模型|Agent|AIGC|智能|智算',re.I)
PFX=re.compile(r'^\s*(?:\d{2,4}届)?(?:校招|校园招聘|实习生?|日常实习|暑期实习|应届生?)\s*[-－–—]\s*')
CN='北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|四川|贵州|云南|陕西|甘肃|青海|内蒙古|宁夏|新疆|西藏|香港|澳门|台湾|深圳|广州|杭州|南京|苏州|无锡|常州|南通|宁波|温州|绍兴|嘉兴|金华|台州|合肥|芜湖|福州|厦门|泉州|南昌|济南|青岛|烟台|潍坊|济宁|临沂|郑州|洛阳|武汉|长沙|成都|绵阳|南充|攀枝花|永川|贵阳|昆明|西安|兰州|西宁|银川|乌鲁木齐|呼和浩特|包头|沈阳|大连|营口|辽阳|丹东|鞍山|长春|哈尔滨|石家庄|唐山|保定|太原|南宁|柳州|桂林|海口|三亚|东莞|佛山|珠海|中山|惠州|汕头|徐州|扬州|盐城|泰州|镇江|湖州|淮安|连云港|宿迁|廊坊|邯郸|株洲|宜昌|襄阳|赣州|遵义|拉萨'
LOC=re.compile(CN+r'|[市省]$|战区|天街|万达|大道|广场')
NOTLOC=re.compile(r'部|中心|事业|业务|团队|研究院|实验室|BG|BU',re.I)
def _wb(w): return r'(^|[^A-Za-z])(%s)([^A-Za-z]|$)'%w
RULES=[('商务',re.compile('商务|'+_wb('BD')+'|商业化|渠道|合作|招商|采购|供应链|投资|战略',re.I)),('职能',re.compile('招聘|雇主品牌')),
 ('市场',re.compile('市场|营销|品牌|公关|'+_wb('PR')+'|广告|媒介|增长',re.I)),('销售',re.compile('销售|客户经理|大客户|售前|售后|客户成功|'+_wb('KA'),re.I)),
 ('设计',re.compile('设计|视觉|交互|'+_wb('UI|UX')+'|美术|原画|动画|插画',re.I)),
 ('职能',re.compile(_wb('HR(BP)?')+'|人力|招聘|财务|会计|审计|税务|法务|律师|合规|风控|行政|秘书|助理|内控|IT支持',re.I))]
def segments(title):
  t=PFX.sub('',re.sub(r'【[^】]*】|\[[^\]]*\]','',str(title)))
  return [x.strip() for x in re.split(r'\s*[-－—–]\s*',t) if x.strip()]
def role_segment(title):
  s=segments(title);return next((x for x in s if ROLE.search(x)),s[0] if s else '')
def classify(title):
  s=segments(title);h=role_segment(title)
  if any(EXCLUDE_ANY.search((x.replace('测试','') if '运营' in x else x).replace('开发者','')) for x in s): return None
  t=re.sub('前端|后端|客户端|架构师|芯片','',h) if '产品' in h else h
  if EXCLUDE.search(t): return None
  if '运营' in h: return '运营'
  if '采购' in h: return '职能'
  if '产品专家' in title:
    tail=s[s.index(h)+1:] if h in s else []
    if re.search('城市|门店|零售',title) or any(LOC.search(x) and not NOTLOC.search(x) and not ROLE.search(x) for x in tail): return '销售'
  if '产品' in h: return 'AI产品' if AI.search(h) else '产品'
  for c,r in RULES:
    if r.search(h): return c
  return '其他'
TESTS={'优才-运控算法工程师-Genie业务部':None,'运营专员-XX研究院':'运营','产品经理-研发中心':'产品','产品专家实习生-四川攀枝花':'销售','产品专家实习生-上海市':'销售',
 '产品专家-AI平台部':'产品','采购实习生':'职能','供应链采购专员':'职能','产品运营实习生':'运营','校园招聘及雇主品牌实习生':'职能','智算平台产品实习生':'AI产品','测试运营实习生':'运营','市场实习生-开发者AI':'市场','管培生':'其他','商务管培生':'商务','研发项目管理实习生':None}
if __name__=='__main__':
  bad=[(k,classify(k),v) for k,v in TESTS.items() if classify(k)!=v];print('FAIL',bad) if bad else print('all',len(TESTS),'pass')
