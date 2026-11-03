#!/usr/bin/env node
// 全网（15 家）+ AI 初创（24 家）周跑抓取：按 scripts/datasets.json + scripts/startups.json 逐家抓官网 → 与 merge_staging.js 相同的后处理 → data/<week>/<file>.json
// 后处理：classifyJob 重算类别（null=技术岗排除）→ 社招只留实习 → 标 region → 与本周大厂文件及先处理的公司跨来源去重 → dataset=全网/初创（微博/Shopee/知乎归全网）
//         link_check 沿用上一份同 id 记录的结果（没有 → 待核）
// 失败（接口报错 / 0 条但以前有 / 少于上一份 MIN_RATIO=50%）：不写文件 → build 沿用最近一周的旧文件，fetched_at 保持旧值，超 14 天显示「⏳可能已下架」
// 必须在大厂抓取器之后跑（去重要读本周大厂文件）。type=manual 的公司（星海图）从不写，靠 build 沿用。
// 用法：node scripts/fetch_datasets.js [--week 2026-W45] [--only nio,moonshot] [--out dir] [--dry-run]
// 退出码：有公司失败 → 2（其余公司照常写出），全部成功 → 0
const fs = require('fs'), path = require('path');
const { classify, classifyJob, normCities, dropSocial, args, isoWeek, cityFromText } = require('./lib/common');
const { tagRegion } = require('./lib/overseas');
const { postId } = require('./lib/site');
const feishu = require('./fetchers/lib/feishu'), moka = require('./fetchers/lib/moka'), others = require('./fetchers/lib/others');
const a = args(), week = a.week || isoWeek(), ROOT = path.join(__dirname, '..'), DATA = path.join(ROOT, 'data'), WK = path.join(DATA, week), OUT = a.out || WK;
const MIN = +(process.env.MIN_RATIO || 0.5);
const TO_QW = new Set(['weibo', 'shopee', 'zhihu']);
const only = a.only ? new Set(String(a.only).split(',')) : null;

// —— 公司列表：[{ds, slug, file, srcs:[cfg]}]，同 slug 多源（校招站+社招站）合并
const cfg = require('./datasets.json'), st = require('./startups.json'), C = new Map();
const put = (ds, c) => { const file = c.file || c.slug; (C.get(file) || C.set(file, { ds, slug: c.slug, file, srcs: [] }).get(file)).srcs.push(c); };
for (const ds of ['全网', '初创']) for (const c of cfg[ds]) put(ds, c);
for (const type of ['feishu', 'moka']) for (const c of st[type]) put(TO_QW.has(c.slug) ? '全网' : '初创', { ...c, type });
// 与 merge_staging 一致：全网在前、初创在后，各自按 slug 排序（决定跨来源去重谁保留）
const companies = [...C.values()].sort((x, y) => (x.ds === y.ds ? 0 : x.ds === '全网' ? -1 : 1) || x.file.localeCompare(y.file));

// —— 去重登记（同 merge_staging）
const normUrl = u => String(u || '').trim().replace(/^http:/, 'https:').replace(/[#?].*$/, x => x.startsWith('?') ? x : '').replace(/\/$/, '');
const coKey = s => String(s || '').replace(/[（(].*?[)）]/g, '').trim();
const newSeen = () => ({ pid: new Set(), tc: new Set(), url: new Set(), t: new Set() });
const seen = newSeen();
const cityKey = j => [...normCities(j.city)].sort().join('/');
const add = (slug, j, S = seen) => { S.pid.add(slug + '|' + postId(j.apply_url)); S.tc.add(coKey(j.company) + '|' + j.title.trim() + '|' + cityKey(j)); S.url.add(normUrl(j.apply_url) + '|' + j.title.trim()); S.t.add(slug + '|' + j.title.trim()); };
const dupOf = (slug, j) => seen.pid.has(slug + '|' + postId(j.apply_url)) ? 'id' : seen.tc.has(coKey(j.company) + '|' + j.title.trim() + '|' + cityKey(j)) ? '公司+标题+城市'
  : seen.url.has(normUrl(j.apply_url) + '|' + j.title.trim()) ? '链接' : (j.city.length > 1 && seen.t.has(slug + '|' + j.title.trim())) ? '多城聚合同名岗' : null;
const read = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const isDS = L => Array.isArray(L) && L.some(j => j.dataset && j.dataset !== '大厂');
// 本周大厂文件先登记（不含 @ 增量和全网/初创文件）
for (const f of fs.existsSync(WK) ? fs.readdirSync(WK).filter(f => f.endsWith('.json') && !f.includes('@')) : []) {
  const L = read(path.join(WK, f)); if (!Array.isArray(L) || isDS(L)) continue; L.forEach(j => add(f.slice(0, -5), j)); }
// 上一份文件：本周（重跑）或最近更早一周
const weeks = fs.readdirSync(DATA).filter(w => /^\d{4}-W\d{2}$/.test(w) && w <= week).sort().reverse();
const prevOf = file => { for (const w of weeks) { const L = read(path.join(DATA, w, file + '.json')); if (Array.isArray(L)) return { w, L }; } return null; };

async function fetchSrc(c) {
  if (c.type === 'feishu') return feishu.fetchCompany(c);
  if (c.type === 'moka') return moka.fetchCompany(c);
  if (others[c.type]) { const r = await others[c.type](c);
    // 标题过了 classify、且不是社招非实习，才取详情（classifyJob 先要 classify 非空，结果等价，省请求）
    const jobs = []; for (const j of r.jobs) { const { _detail, ...k } = j; if (!classify(k.title) || !dropSocial([k]).length) continue; if (_detail) k.requirements = await _detail(k); jobs.push(k); }
    return { jobs, stat: { ...r.stat, titlePass: jobs.length } }; }
  throw new Error(`未知 type ${c.type}`);
}

(async () => {
  const rep = [], failed = [];
  for (const co of companies) {
    if (only && !only.has(co.slug) && !only.has(co.file)) continue;
    const r = { dataset: co.ds, file: co.file, types: [...new Set(co.srcs.map(s => s.type))].join('+') }; rep.push(r);
    if (co.srcs.every(s => s.type === 'manual')) { r.status = 'manual'; r.reason = co.srcs[0].reason; continue; }
    let raw = [];
    try {
      for (const s of co.srcs) { const { jobs, stat } = await fetchSrc({ ...s, slug: co.slug }); r[`src:${s.websitePath || s.siteId || s.host || s.type}`] = stat;
        // 飞书/Moka/Manus 原先经 writeJobs 写出：城市为空时从 JD 文本找（cityFromText），保持与入库数据一致；全网 Python 来源原先没这步，不加
        if (['feishu', 'moka', 'manus'].includes(s.type)) for (const j of jobs) if (!normCities(j.city).length) j.city = cityFromText(j.requirements);
        raw.push(...jobs); }
    } catch (e) { r.status = 'failed'; r.error = e.message; failed.push(co.file); console.error(`[${co.file}] 失败，沿用旧文件：${e.message}`); continue; }
    // 多源合并按 id 去重
    raw = [...new Map(raw.map(j => [postId(j.apply_url) + '|' + j.title, j])).values()];
    r.raw = raw.length; r.tech = 0; r.dup = {};
    let L = raw.map(j => ({ ...j, city: normCities(j.city).length ? normCities(j.city) : ['城市见官网'] }));
    L = L.flatMap(j => { const cat = classifyJob(j.title, j.requirements); if (!cat) { r.tech++; return []; } return [{ ...j, category: cat }]; });
    const n = L.length; L = dropSocial(L); r.social = n - L.length;
    const mine = newSeen();
    L = tagRegion(L).flatMap(j => { const d = dupOf(co.slug, j); if (d) { r.dup[d] = (r.dup[d] || 0) + 1; return []; } add(co.slug, j, mine); return [j]; });
    for (const k of Object.keys(seen)) mine[k].forEach(x => seen[k].add(x));
    const prev = prevOf(co.file), lc = new Map((prev?.L || []).map(j => [postId(j.apply_url), j.link_check]));
    L = L.map(j => { const { link_status, id, project, ...k } = j; return { ...k, dataset: co.ds, link_check: lc.get(postId(k.apply_url)) || '待核' }; });
    r.kept = L.length; r.prev = prev ? `${prev.L.length}@${prev.w}` : null;
    if (prev) { const old = new Set(prev.L.map(j => postId(j.apply_url))), now = new Set(L.map(j => postId(j.apply_url)));
      r.same = [...now].filter(x => old.has(x)).length; r.added = now.size - r.same; r.removed = [...old].filter(x => !now.has(x)).length; }
    if (!L.length && !prev) { r.status = 'empty'; continue; }  // 配置里有、库里从没收过（如 DeepSeek 目前无非技术岗）：不算失败
    if (!L.length) { r.status = 'failed'; r.error = '0 条（接口异常或真没岗位），不写，沿用旧文件'; failed.push(co.file); continue; }
    if (prev && L.length < prev.L.length * MIN) { r.status = 'failed'; r.error = `新 ${L.length} < 旧 ${prev.L.length}×${MIN}，疑似异常，不覆盖`; failed.push(co.file); continue; }
    r.status = 'ok';
    if (a['dry-run']) continue;
    fs.mkdirSync(OUT, { recursive: true }); const f = path.join(OUT, co.file + '.json');
    fs.writeFileSync(f + '.tmp', JSON.stringify(L, null, 2) + '\n'); fs.renameSync(f + '.tmp', f);
  }
  console.log(JSON.stringify(rep, null, 1));
  if (failed.length) { console.error(`失败 ${failed.length} 家（沿用旧文件）：${failed.join(' ')}`); process.exit(2); }
})().catch(e => { console.error(e); process.exit(1); });
