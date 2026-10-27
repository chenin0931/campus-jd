// 抓取共用：分类、ISO 周、限速+重试请求、安全写出。Node 18+，无依赖。
const fs = require('fs'), path = require('path');

const EXCLUDE = /开发|研发|算法|工程师|测试|研究|课题/;
const AI = /AI|大模型|Agent|AIGC|智能/i;
// 只看「-」前的岗位名：排除技术/研究类；含产品→产品（再含 AI 关键词→AI产品）；含运营→运营；否则 null（丢弃）
function classify(title) {
  const h = String(title).split(/\s*[-－—]\s*/)[0];
  if (EXCLUDE.test(h)) return null;
  if (h.includes('产品') && !h.includes('运营')) return AI.test(h) ? 'AI产品' : '产品';
  if (h.includes('运营')) return '运营';
  return null;
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

// 快手/美团/小红书用的分类（来自 reference/more.py）：去掉【】[] 前缀，额外排除“设计”，先判运营再判产品
function classifyMore(title) {
  const h = String(title).replace(/【[^】]*】|\[[^\]]*\]/g, '').split(/\s*[-—–]\s*/)[0];
  if (/开发|研发|算法|工程师|测试|研究|设计/.test(h)) return null;
  if (h.includes('运营')) return '运营';
  if (h.includes('产品')) return AI.test(h) ? 'AI产品' : '产品';
  return null;
}
module.exports.classifyMore = classifyMore;
