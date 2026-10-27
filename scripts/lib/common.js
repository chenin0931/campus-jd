// 抓取共用：分类、ISO 周、限速+重试请求、安全写出。Node 18+，无依赖。
const fs = require('fs'), path = require('path');

// 分类：唯一实现，规则见 scripts/reference/CLASSIFIER.md（排除技术类，其余全收，9 类）
// 全标题排除词：任何一段出现都排除（「优才-运控算法工程师-Genie业务部」）
const EXCLUDE_ANY = /算法|工程师|开发|测试/;
// 岗位段排除词：只在岗位名段里查（「产品经理-研发中心」「运营专员-XX研究院」保留）
const EXCLUDE = /研发|研究员|研究型|研究科学家|科研|课题|技术研究|数据工程|网络技术|数据中心技术|芯片|前端|后端|客户端|全栈|架构师|运维|(^|[^A-Za-z])(Engineer|SRE|Developer|Researcher)([^A-Za-z]|$)/i;
// 岗位名段：标题按「-」切段后，取第一个含岗位词的段（跳过「单车业务-」「供应链-」这类部门前缀）
const ROLE = /实习|工程师|经理|专员|主管|研究员|分析师|架构师|策划|运营|产品|设计|开发|研发|算法|测试|顾问|管培|培训生|助理|岗|师|Engineer|Manager|Intern/i;
const AI = /AI|大模型|Agent|AIGC|智能|智算/i;
const RULES = [
  ['商务', /商务|(^|[^A-Za-z])BD([^A-Za-z]|$)|商业化|渠道|合作|招商|采购|供应链|投资|战略/i],
  ['职能', /招聘|雇主品牌/],
  ['市场', /市场|营销|品牌|公关|(^|[^A-Za-z])PR([^A-Za-z]|$)|广告|媒介|增长/i],
  ['销售', /销售|客户经理|大客户|售前|售后|客户成功|(^|[^A-Za-z])KA([^A-Za-z]|$)/i],
  ['设计', /设计|视觉|交互|(^|[^A-Za-z])(UI|UX)([^A-Za-z]|$)|美术|原画|动画|插画/i],
  ['职能', /(^|[^A-Za-z])HR(BP)?([^A-Za-z]|$)|人力|招聘|财务|会计|审计|税务|法务|律师|合规|风控|行政|秘书|助理|内控|IT支持/i],
];
function classify(title) {
  const segs = String(title).replace(/【[^】]*】|\[[^\]]*\]/g, '').split(/\s*[-－—–]\s*/).map(x => x.trim()).filter(Boolean);
  const h = segs.find(x => ROLE.test(x)) || segs[0] || '';
  // 全标题扫描：逐段查 EXCLUDE_ANY。「开发者」（如「市场实习生-开发者AI」）是部门名不算；含「运营」的段里「测试」不算（「测试运营」）
  const any = segs.some(x => EXCLUDE_ANY.test((x.includes('运营') ? x.replace(/测试/g, '') : x).replace(/开发者/g, '')));
  // 岗位段扫描：含「产品」时端侧词不算（「前端产品」「产品解决方案架构师」）
  const t = h.includes('产品') ? h.replace(/前端|后端|客户端|架构师|芯片/g, '') : h;
  // 任一段以「研究」结尾或含「研究与应用」的课题式标题是科研岗；用户/产业/行业/市场研究除外
  const topic = segs.some(x => /研究$|研究与应用/.test(x) && !/(用户|产业|行业|市场|数字生态)研究/.test(x));
  if (any || topic || EXCLUDE.test(t)) { if (process.env.DUMP_EXCLUDED) fs.appendFileSync(process.env.DUMP_EXCLUDED, title + '\n'); return null; }  // DUMP_EXCLUDED=文件：调试用
  if (h.includes('运营')) return '运营';
  if (h.includes('产品')) return AI.test(h) ? 'AI产品' : '产品';
  for (const [c, re] of RULES) if (re.test(h)) return c;
  return '其他';
}


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
function writeJobs(slug, jobs, opts = {}) {
  const a = { ...args(), ...opts };
  const dir = a.out || path.join(__dirname, '..', '..', 'data', a.week || isoWeek());
  const file = path.join(dir, `${slug}.json`);
  const need = ['company', 'title', 'category', 'city', 'requirements', 'deadline', 'apply_url', 'source_url', 'fetched_at', 'job_type'];
  for (const j of jobs) for (const k of need) if (!(k in j)) throw new Error(`字段缺失 ${k}: ${j.title}`);
  if (!jobs.length) throw new Error(`${slug}: 0 条，不写出`);
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
module.exports = { classify, isoWeek, nowIso, request, cookiesOf, args, writeJobs, run, sleep };

