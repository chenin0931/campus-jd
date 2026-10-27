// 抓取共用：分类、ISO 周、限速+重试请求、安全写出。Node 18+，无依赖。
const fs = require('fs'), path = require('path');

// 分类：唯一实现，规则见 scripts/reference/CLASSIFIER.md（排除技术类，其余全收，9 类）
// 城市/门店地名（产品专家→销售特例用），与 reference/classify.py 的 CN/LOC/NOTLOC 相同
const LOC = new RegExp('北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|四川|贵州|云南|陕西|甘肃|青海|内蒙古|宁夏|新疆|西藏|香港|澳门|台湾|深圳|广州|杭州|南京|苏州|无锡|常州|南通|宁波|温州|绍兴|嘉兴|金华|台州|合肥|芜湖|福州|厦门|泉州|南昌|济南|青岛|烟台|潍坊|济宁|临沂|郑州|洛阳|武汉|长沙|成都|绵阳|南充|攀枝花|永川|贵阳|昆明|西安|兰州|西宁|银川|乌鲁木齐|呼和浩特|包头|沈阳|大连|营口|辽阳|丹东|鞍山|长春|哈尔滨|石家庄|唐山|保定|太原|南宁|柳州|桂林|海口|三亚|东莞|佛山|珠海|中山|惠州|汕头|徐州|扬州|盐城|泰州|镇江|湖州|淮安|连云港|宿迁|廊坊|邯郸|株洲|宜昌|襄阳|赣州|遵义|拉萨|[市省]$|战区|天街|万达|大道|广场');
const NOTLOC = /部|中心|事业|业务|团队|研究院|实验室|BG|BU/i;
// 全标题排除词：任何一段出现都排除（「优才-运控算法工程师-Genie业务部」）
const EXCLUDE_ANY = /算法|工程师|开发|测试/;
// 制造/工艺类工程岗（全标题，含培训生）；岗位段含 产品/运营 时不算（「智能制造产品经理」保留）
const MFG = /智造|制造|工艺/;
// 汽车工程/技师/医师等技术岗（全标题，岗位名段含产品/运营时不触发）
const AUTO_TECH = /底盘|电池|电驱|内饰|座椅|仪表板|NVH|CFD|线束|电子电控|热管理|焊装|涂装|总装设备|造型工程|总布置|人机工程|智能诊断|AI前瞻|法规认证|服务工程|质量工程|乘用车系统|技师|超星计划|医师/;
// 岗位段排除词：只在岗位名段里查（「产品经理-研发中心」「运营专员-XX研究院」保留）
const EXCLUDE = /研发|研究员|研究型|研究科学家|科研|课题|技术研究|数据工程|网络技术|数据中心技术|芯片|前端|后端|客户端|全栈|架构师|运维|嵌入式|机械结构|结构设计|电机|CNC|关节模组|技术美术|偏工程|爬虫|质量工程|Agent构建|Agentic|数据合成|仿真|决策规划|规控|低功耗|服务端|Golang|Java|DevOps|MLOps|LLMOps|运维开发|(^|[^A-Za-z])(Engineer(s|ing)?|SRE|Developers?|Researchers?|Research Scientist|Algorithms?|ML|QA|TA)([^A-Za-z]|$)/i;
// 模型训练/能力构建类技术课题：岗位段含 产品/运营/设计/评测/标注 时不触发（「模型训练产品实习生」「VLM数据运营（基础模型）」保留）
const TECH_MODEL = /模型训练|训练\/推理|能力构建|大模型能力|模型能力|基础模型|预训练|后训练|微调/i;
// 岗位名段：标题按「-」切段后，取第一个含岗位词的段（跳过「单车业务-」「供应链-」这类部门前缀）
const ROLE = /实习|工程师|经理|专员|主管|研究员|分析师|架构师|策划|运营|产品|设计|开发|研发|算法|测试|顾问|管培|培训生|助理|岗|师|Engineer|Manager|Intern|Specialist|Associate|Analyst|Designer|Artist|Lead/i;
// 只对「其他」兜底生效的技术课题词（不影响产品/运营等已归类岗位，如「多模态AI产品经理」）
const TECH_OTHER = /训练|预测模型|模型实验|时序|推理|模型(压缩|优化|建模)|性能优化|异构|高性能|架构|Infra|攻防|(网络|信息|系统|数据|AI|模型|云|终端|应用)安全|NLP|自然语言|深度学习|强化学习|(^|[^A-Za-z])RL([^A-Za-z]|$)|多模态|世界模型|World Model|表征|生成(基础)?模型|大数据|Data Engineering|Android|iOS|(推理|训练|AI|算法|软件|系统|数据|平台|模型|Infra)工程|软硬件|系统软件|FDE|机器学习|训推|模型系统|计算语言学|内核|编译|算子|GPU|检索系统|对抗|蓝军|威胁情报|可信计算|安全工具|安全研究|基础设施|灵巧手|硬件|VLA|自动驾驶|基模|智能体|Agent|大模型|RSI|递归|AI4SE|评测|Vibe|技术(?!文档|传播)/i;
// 硬件/芯片/数据系统/预研/编解码/3D 资产生成类技术岗（岗位段）：岗位段含 产品/销售/采购/职能/市场/运营/商务 等业务词时不触发（「硬件产品经理」「硬件销售」「硬件采购」保留）
const HW_TECH = /(?<![a-zA-Z])结构(?!化|性)|机械|AI研究|研究创新|语义理解|硬件|数据系统|预研|编解码|几何资产|3D生成|三维生成|3D重建|RTL|FPGA|IC设计|数字前端|数字后端|模拟电路|电路设计|PCB/i;
const HW_BIZ = /原画|美术|资产管理|IT支持|交互|体验|战略|投资|产品|销售|采购|职能|市场|营销|运营|商务|BD|渠道|供应链|项目|招聘|HR|品牌|传播|策划|Sales|Product|Marketing/i;
const AI = /AI|大模型|Agent|AIGC|智能|智算/i;
const RULES = [
  // 供应链：在运营/产品之后、商务之前；采购已在前面归职能；「计划」只认业务计划，排除 人才/星/实习/招聘/培养 计划
  ['供应链', /物料|(^|[^A-Za-z])PMC([^A-Za-z]|$)|品质|(?<!内容|模型|数据)质量|供应链|物流|仓储|备件|供应管理|质控|质检|(?<!人才|专项|星|实习|招聘|培养|管培|校招|北斗|启航|领航|英才)计划(?!精英|生)/],
  // 模型评测/标注岗归 AI产品（先于审计等职能词）
  ['AI产品', /评测|标注|语料|\bEval\w*/i],
  ['商务', /\bPartnerships?\b|商务|(^|[^A-Za-z])BD([^A-Za-z]|$)|商业化|渠道|合作|招商|拓展|采销|采购|投资|投融资|战略|Business Development/i],
  ['职能', /招聘|雇主品牌/],
  ['市场', /市场|营销|品牌|公关|(^|[^A-Za-z])PR([^A-Za-z]|$)|广告|媒介|增长|Marketing|公共事务|政府事务|政府关系|技术传播|SEO|视频剪辑|视频创意|视频制作|创意制作|新媒体|校园大使|\b(Growth|Community|Content)\b/i],
  ['销售', /销售|客户经理|大客户|售前|售后|客户成功|顾问|规划师|直营管理|新零售|解决方案|\b(Sales|Accounts?|Retail)\b|(^|[^A-Za-z])KA([^A-Za-z]|$)/i],
  ['设计', /\b(Design|Designer|Artist)s?\b|设计|视觉|交互|(^|[^A-Za-z])(UI|UX)([^A-Za-z]|$)|美术|原画|分镜|GUI|[23]D动作|动作(设计|美术|师)|动画|插画|模型师|特效|灯光|用户体验/i],
  ['职能', /(^|[^A-Za-z])HR(BP)?([^A-Za-z]|$)|人力|招聘|财务|会计|审计|税务|法务|律师|合规|风控|行政|秘书|助理|内控|IT支持|财经|资金|理赔|薪酬|组织发展|造价|会务|接待|保密|金融|融租|资管|资产|成本管理|企业文化|组织文化|人才发展|HRIS|企业流程|对外事务|\b(Recruit\w*|Finance|Legal)\b/i],
  ['项目管理', /项目|建设服务|装饰装修|(^|[^A-Za-z])PMO?([^A-Za-z]|$)/i],
  ['分析', /分析|数据|洞察|用户研究|商分|策略|咨询|数据科学|政策研究|行业研究|收益管理|Analy|Data Scien/i],
  ['策划', /策划/],
  ['运营', /交付|内容|排播|编辑|配音/],  // 最后兜一层：内容/编辑/配音/交付类归运营（内容设计/内容策划已在前面）
];
// LOC/NOTLOC: 城市地名表与 classify.py 中 CN/LOC/NOTLOC 相同
// 标题前缀清洗（原先散在各抓取器里）：去（J123）编号，去开头的城市段、届别/校招段（「北京-人力资源-…」「27届-」「2027校招-」「27届秋招-」）
const PREFIX_SEG = new RegExp('^(?:(?:20)?\\d{2}(?:届|级)?(?:秋招|春招|校招|校园招聘|实习)?|(?:' + LOC.source.split('|[市省]$')[0] + ')(?:市)?)$');
function cleanTitle(title) {
  const s = String(title).replace(/[（(]\s*J\d+\s*[）)]/g, '').trim();
  const segs = s.split(/\s*[-－—–―‒]+\s*/);
  let i = 0; while (i < segs.length - 1 && PREFIX_SEG.test(segs[i].trim())) i++;
  return segs.slice(i).join('-');
}
function classify(title) {
  title = cleanTitle(title);
  // 先去成对的【】[]，不成对的【】[]、全角空格当分隔符；长横线 — ― 、‒ 也切
  const segs = String(title).replace(/【[^】]*】|\[[^\]]*\]/g, '').replace(/[【】\[\]\u3000]/g, '-').split(/\s*[-－—–―‒]+\s*/).map(x => x.trim()).filter(Boolean);
  const GENERIC = /^(日常|暑期|留用|校招|校园|社招|项目)?(实习(生)?|校招)$/;  // 纯「实习」段不当岗位名，取后面的段
  const h = segs.find(x => ROLE.test(x) && !GENERIC.test(x)) || segs.find(x => !GENERIC.test(x)) || segs[0] || '';
  // 全标题扫描：逐段查 EXCLUDE_ANY。「开发者」（如「市场实习生-开发者AI」）是部门名不算；含「运营」的段里「测试」不算（「测试运营」）
  // 岗位段含 产品/运营 时只忽略「算法」
  const pa = h.includes('产品') || h.includes('运营');
  const any = segs.some(x => { let y = (x.includes('运营') ? x.replace(/测试/g, '') : x).replace(/开发者/g, ''); if (pa) y = y.replace(/算法/g, ''); return EXCLUDE_ANY.test(y); });
  // 岗位段扫描：含「产品」时端侧词不算（「前端产品」「产品解决方案架构师」）
  const t = h.includes('产品') ? h.replace(/前端|后端|客户端|架构师|芯片/g, '') : h;
  // 任一段以「研究」结尾或含「研究与应用」的课题式标题是科研岗；用户/产业/行业/市场研究除外
  const mfg = !pa && (MFG.test(title) || AUTO_TECH.test(title));
  const topic = segs.some(x => /研究$|研究与应用|研究实习/.test(x) && !/(用户|产业|行业|市场|数字生态|评测|政策|体验)研究/.test(x));
  const tm = TECH_MODEL.test(h) && !/产品|运营|设计|评测|标注|语料|战略|商务|市场|销售|BD/.test(h);
  const hw = HW_TECH.test(h) && !HW_BIZ.test(h);
  if (/AI研究|研究创新/.test(h) && !/产品|运营|市场|商务|战略|评测/.test(h)) { return null; }
  if (any || mfg || topic || tm || hw || EXCLUDE.test(t)) { if (process.env.DUMP_EXCLUDED) fs.appendFileSync(process.env.DUMP_EXCLUDED, title + '\n'); return null; }  // DUMP_EXCLUDED=文件：调试用
  // 招聘/HR/Talent Acquisition 归职能，先于运营（「校招运营HR实习生」）；岗位段含 产品 时不触发
  // 分析优先（§9）：岗位主干（去掉括号说明）含 数据分析/数据科学/洞察/商分/商业分析/经营分析 → 分析，先于 运营/产品；岗位是产品经理/供应链时不触发
  const hp = h.replace(/[（(][^）)]*[）)]/g, '');
  if (/数据分析|数据科学|洞察|商分|商业分析|经营分析|Insight|Data Scien/i.test(hp) && !/产品经理|产品专家|Product Manager|供应链/i.test(hp)) return '分析';
  if (/(^|[^A-Za-z])HR(BP|IS|SSC)?([^A-Za-z]|$)|Talent Acquisition|招聘|人力资源/i.test(h) && !/产品/.test(h)) return '职能';
  if (/运营|Operation|\bOps\b|\bCategory\b|客服|城市经营|\bCSM\b|Customer Success/i.test(h)) return '运营';
  if (h.includes('采购') && !h.includes('产品经理')) return '职能';
  // 销售优先于 渠道/商业化/拓展（§9）：岗位段含 销售/Sales 且不含 产品 → 销售
  if (/销售|\bSales\b/i.test(h) && !/产品|采销/.test(h)) return '销售';
  // 关键词（§9）：外展→运营；发行→市场；ESG→职能；转写/Transcription→AI产品；游戏设计师→策划；多模态/具身数据→AI产品
  if (/外展|Outreach/i.test(h)) return '运营';
  if (/转写|Transcri/i.test(h)) return 'AI产品';
  if (/(多模态|具身)(智能)?(多模态)?数据(实习|专员|产品|运营|标注|采集)/.test(h)) return 'AI产品';
  if (/游戏设计师|Game Designer/i.test(h)) return '策划';
  if (/发行/.test(hp) && !/产品/.test(hp)) return '市场';
  if (/(^|[^A-Za-z])ESG([^A-Za-z]|$)/i.test(h)) return '职能';
  if (/项目经理|项目管理/.test(h)) return '项目管理';  // 显式「项目经理」先于产品；单独「项目」在产品/运营之后（RULES）
  if (/用户研究/.test(h)) return '分析';
  if (/服务储备|储备|NSC|售后服务|服务大区|督导|经纪/.test(h)) return '运营';  // 门店/服务网络岗（服务工程已在排除里）
  if (/设计师|视觉设计|创意设计|\bDesigners?\b/i.test(h)) return '设计';  // 设计师先于产品/市场：AI 产品设计师、营销创意设计师、品牌与视觉设计归设计
  // 分析优先于市场/增长：数据分析/洞察/商分/经营分析/商业分析（岗位段含 产品/供应链 时不触发）
  if (/数据分析|洞察|商分|商业分析|经营分析|Insight/i.test(h) && !/产品|供应链/.test(h)) return '分析';
  // 资本市场/投融资/IR 归职能（先于市场、商务）
  if (/资本市场|投融资|投资者关系|(^|[^A-Za-z])IR([^A-Za-z]|$)|Investor Relations/i.test(h)) return '职能';
  if (/企划/.test(h)) return '策划';
  if (/业务发展/.test(h)) return '商务';
  // 单独的 PM（产品经理缩写）归产品；PMO/项目 PM 仍走项目管理
  if (/(^|[^A-Za-z])PM([^A-Za-z]|$)/.test(h) && !/项目|PMO/.test(h)) return AI.test(h) ? 'AI产品' : '产品';
  if (/产品营销|产品市场|\bGTM\b/i.test(h) || /^(市场|营销)/.test(h)) return '市场';  // 岗位名以市场/营销开头时不被括号里的渠道等词带去商务  // 产品营销/GTM 是市场岗
  if (title.includes('产品专家')) { const tail = segs.slice(segs.indexOf(h) + 1); if (/城市|门店|零售/.test(title) || tail.some(x => LOC.test(x) && !NOTLOC.test(x) && !ROLE.test(x))) return '销售'; }
  // 传播/后期制作 归市场，先于产品（「产品传播」「视频后期制作」）
  if (/传播|后期制作/.test(h)) return '市场';
  if (/语料/.test(h)) return 'AI产品';  // 大模型语料岗与评测/标注同口径
  if (h.includes('产品') || (/\bProducts?\b/i.test(h) && !/\bDesigner\b/i.test(h))) return AI.test(h) ? 'AI产品' : '产品';  // 英文：AI Product→AI产品，Product Manager→产品
  for (const [c, re] of RULES) if (re.test(h)) return c;
  // 兜底：落到「其他」的标题若含技术课题词（模型训练/推理/架构/安全/多模态/智能体等），按技术岗排除
  if (TECH_OTHER.test(title)) return null;
  return '其他';
}


// JD 描述第二道把关（§10）：仅当标题岗位段不含业务词且有描述时，按强技术信号排除；Python/SQL 等弱信号不算；无描述只按标题
const BIZ_WORD = /物料|PMC|Eval|产品|运营|销售|市场|营销|品牌|公关|传播|商务|拓展|渠道|BD|设计|美术|视觉|策划|企划|分析|数据科学|洞察|研究|咨询|招聘|HR|人力|财务|会计|审计|法务|合规|行政|秘书|采购|供应链|物流|质量|品质|项目|PM|客服|编辑|内容|评测|标注|语料|转写|发行|管培|培训生|助理|顾问|战略|投资|Product|Operation|Sales|Marketing|Design|Artist|Analy|Business|Recruit|Finance|Legal|Account|Growth|Community|Content/i;
const JD_STRONG = /研究型人才|博士生科研|后端开发|后端工程|Golang|Go语言|Java开发|C\+\+开发|SolidWorks|机械设计|\bRTL\b|Verilog|FPGA|CUDA|嵌入式开发|驱动开发|(?:博士|PhD).{0,30}(?:研究|论文)|(?:顶会|一作).{0,10}论文|(?:发表|发表过).{0,15}(?:CVPR|NeurIPS|ICML|ICLR|ACL|AAAI)/i;
function jdTech(title, req) {
  if (!req || !String(req).trim()) return false;
  const segs = cleanTitle(title).replace(/【[^】]*】|\[[^\]]*\]/g, '').split(/\s*[-－—–―‒]+\s*/).map(x => x.trim()).filter(Boolean);
  const h = segs.find(x => ROLE.test(x)) || segs[0] || '';
  // 课题制岗位（描述以「课题背景/课题要求/课题挑战」组织，如腾讯青云计划）是科研课题，不论标题词都排除
  const tp = String(req).match(/课题(背景|要求|挑战)/); if (tp) return tp[0];
  if (BIZ_WORD.test(h)) return false;
  const m = String(req).match(JD_STRONG); return m ? m[0] : false;
}
// 带描述的完整分类：标题规则 → JD 第二道把关
function classifyJob(title, req) { const c = classify(title); if (!c) return null; return jdTech(title, req) ? null : c; }

function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
const nowIso = () => { const d = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19); return d + '+08:00'; };

const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = 0;
// 限速（默认每请求间隔 ≥ RATE_MS）+ 指数退避重试；返回解析后的 JSON
async function request(url, { method = 'GET', headers = {}, body, retries = 5, rateMs = +process.env.RATE_MS || 400, raw = false } = {}) {
  let err;
  for (let i = 0; i < retries; i++) {
    const wait = last + rateMs - Date.now(); if (wait > 0) await sleep(wait); last = Date.now();
    try {
      const r = await fetch(url, { method, headers, body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)), signal: AbortSignal.timeout(60e3) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return raw ? r : await r.json();
    } catch (e) { err = e; console.error(`  retry ${i + 1}/${retries} ${url.slice(0, 80)}: ${e.message}`); await sleep(1000 * 2 ** i); }
  }
  throw new Error(`请求失败: ${url} (${err?.message})`);
}
const cookiesOf = r => r.headers.getSetCookie().map(c => c.split(';')[0]);

function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1]?.startsWith('--') || a[i + 1] == null ? true : a[++i];
  return o;
}

// 写出：校验字段；条数为 0 或低于旧文件 MIN_RATIO（默认 50%）时拒绝覆盖（--force 跳过）；原子写入
// 岗位描述里找城市：优先「工作地点/地点/base/办公」后 30 字内的城市，否则取出现最多的城市；都没有 → 「城市见官网」
const CN_CITIES = LOC.source.split('|[市省]$')[0].split('|').filter(x => !/^(河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|四川|贵州|云南|陕西|甘肃|青海|内蒙古|宁夏|新疆|西藏|台湾)$/.test(x));
function cityFromText(text) {
  const t = String(text || ''), re = new RegExp(CN_CITIES.join('|'), 'g');
  const near = [...t.matchAll(/(工作地点|工作城市|地点|base|Base|办公)[^。\n]{0,30}/g)].flatMap(m => m[0].match(re) || []);
  const pool = near.length ? near : (t.match(re) || []); if (!pool.length) return ['城市见官网'];
  const n = {}; pool.forEach(c => n[c] = (n[c] || 0) + 1); const top = Math.max(...Object.values(n));
  return Object.keys(n).filter(c => n[c] === top);
}
// 城市名归一化：去末尾「市」（上海市→上海），中国香港→香港，雄安等保持不变；去重
function normCity(c) { c = String(c).trim(); if (c === '中国香港') return '香港'; if (c === '中国澳门') return '澳门'; if (c === '中国台湾') return '台湾'; return c.length > 2 && c.endsWith('市') ? c.slice(0, -1) : c; }
function normCities(a) { return [...new Set((Array.isArray(a) ? a : [a]).filter(Boolean).map(normCity))]; }
function writeJobs(slug, jobs, opts = {}) {
  const a = { ...args(), ...opts };
  const dir = a.out || path.join(__dirname, '..', '..', 'data', a.week || isoWeek());
  const file = path.join(dir, `${slug}.json`);
  const need = ['company', 'title', 'category', 'city', 'requirements', 'deadline', 'apply_url', 'source_url', 'fetched_at', 'job_type'];
  for (const j of jobs) for (const k of need) if (!(k in j)) throw new Error(`字段缺失 ${k}: ${j.title}`);
  if (!jobs.length) throw new Error(`${slug}: 0 条，不写出`);
  jobs = jobs.filter(j => !jdTech(j.title, j.requirements));  // JD 第二道把关（§10）
  for (const j of jobs) if (!j.city || !j.city.length) j.city = cityFromText(j.requirements);
  for (const j of jobs) j.city = normCities(j.city);
  { const r = require('./overseas').stripOverseas(jobs); jobs = r.jobs; if (r.deleted.length || r.modified.length) console.log(`${slug}: 海外岗后处理 删 ${r.deleted.length}、去海外城市 ${r.modified.length}（§11）`); }  // 公共后处理：海外岗（港澳台以外）删除/去城市
  if (fs.existsSync(file) && !a.force) {
    const old = JSON.parse(fs.readFileSync(file, 'utf8')).length, min = +(process.env.MIN_RATIO || 0.5);
    if (jobs.length < old * min) throw new Error(`${slug}: 新 ${jobs.length} 条 < 旧 ${old} 条×${min}，疑似抓取异常，不覆盖（--force 强制）`);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(jobs, null, 2) + '\n'); fs.renameSync(file + '.tmp', file);
  const c = {}; for (const j of jobs) { const k = `${j.job_type}/${j.category}`; c[k] = (c[k] || 0) + 1; }
  console.log(`${slug}: ${jobs.length} 条 → ${file}`, c);
}

// 统一入口：fetcher 抛错时退出码 1，不写文件
function run(slug, fetcher) {
  fetcher().then(jobs => writeJobs(slug, jobs)).catch(e => { console.error(`[${slug}] 失败，保留旧文件：${e.message}`); process.exit(1); });
}
module.exports = { jdTech, classifyJob, cleanTitle, normCity, normCities, classify, isoWeek, nowIso, request, cookiesOf, args, writeJobs, run, sleep, cityFromText };

