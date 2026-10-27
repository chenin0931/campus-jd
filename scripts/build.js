#!/usr/bin/env node
// 读 data/<最新周>/*.json（自动发现任意公司文件）→ 维护 data/state.json → 生成 site/（给 agent fetch 的预计算静态切片）。
// 只做服务端预计算；不修改 data/<周>/ 下的原始数据。无外部依赖。
// 输出：site/llms.txt、index.json、slices/、by-city/、changes/、jobs/；并刷新 README.md 中的总览表。
const fs = require('fs'), path = require('path');
const { COMPANY, CATS, TYPES, CITY, normCity, citySlug, postId } = require('./lib/site');
const cityName = sl => sl === 'other' ? '其他城市' : (Object.keys(CITY).find(k => CITY[k] === sl) || sl);
const ROOT = path.join(__dirname, '..'), DATA = path.join(ROOT, 'data'), SITE = path.join(ROOT, 'site');
const MAX = 8 * 1024; // 单文件上限（字节）
const weeks = fs.readdirSync(DATA).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort();
if (!weeks.length) { console.error('data/ 下没有周目录'); process.exit(1); }
const cur = weeks.at(-1), prev = weeks.at(-2) || null;
const today = process.env.BUILD_DATE || new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const issues = [];
const linkStatus = fs.existsSync(path.join(DATA, 'link_status.json')) ? JSON.parse(fs.readFileSync(path.join(DATA, 'link_status.json'), 'utf8')) : {};

function load(w) {
  if (!w) return [];
  return fs.readdirSync(path.join(DATA, w)).filter(f => f.endsWith('.json')).sort().flatMap(f => {
    const slug = f.slice(0, -5), arr = JSON.parse(fs.readFileSync(path.join(DATA, w, f), 'utf8'));
    if (!Array.isArray(arr)) { issues.push(`${w}/${f} 不是数组，跳过`); return []; }
    return arr.map(j => {
      const pid = postId(j.apply_url);
      if (!pid) issues.push(`${w}/${f} 无法从 apply_url 取 postId: ${j.apply_url}`);
      if (!CATS[j.category]) issues.push(`${w}/${f} 非法类别 ${j.category}`);
      const jt = TYPES[j.job_type] ? j.job_type : (/实习/.test(j.title) ? '实习' : '校招');
      const city = (Array.isArray(j.city) ? j.city : [j.city]).filter(Boolean).map(normCity);
      return { ...j, id: `${slug}-${pid}`, company_slug: slug, company: j.company || COMPANY[slug] || slug, job_type: jt, city: [...new Set(city)],
        business_unit: Array.isArray(j.business_unit) ? j.business_unit : (j.business_unit ? [j.business_unit] : []) };
    });
  });
}
// 去重（同 id 保留第一条）
const dedup = l => { const m = new Map(); let d = 0; for (const j of l) m.has(j.id) ? d++ : m.set(j.id, j); return [m, d]; };
const [curMap, dup] = dedup(load(cur)), [prevMap] = dedup(load(prev));

// state.json：按 id 记录 first_seen / last_seen / status / removed_at；兼容旧版按 apply_url 的 first_seen
const STATE = path.join(DATA, 'state.json');
let st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
if (!st.jobs) { const old = st.first_seen || {}; st = { jobs: {} };
  for (const j of [...prevMap.values(), ...curMap.values()]) if (old[j.apply_url]) st.jobs[j.id] = { first_seen: old[j.apply_url] }; }
for (const [id, j] of curMap) { const s = st.jobs[id] ||= { first_seen: today }; s.last_seen = today; s.last_week = cur; s.status = 'active'; delete s.removed_at;
  j.first_seen = s.first_seen; j.status = 'active'; j.is_new = prev ? !prevMap.has(id) : false; j.link_status = linkStatus[id]?.status || 'unchecked'; }
const removed = [];
for (const [id, s] of Object.entries(st.jobs)) if (!curMap.has(id) && s.status === 'active') { s.status = 'removed'; s.removed_at = today; if (prevMap.has(id)) removed.push({ ...prevMap.get(id), status: 'removed', first_seen: s.first_seen }); }
st.updated_at = today; st.week = cur;
fs.writeFileSync(STATE, JSON.stringify(st, null, 1) + '\n');
const jobs = [...curMap.values()];

// ---------- 渲染 ----------
const esc = s => String(s ?? '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
const flag = j => (j.is_new ? ' 🆕' : '') + (j.link_status === 'invalid' ? ' ❌疑似下架' : j.link_status === 'unverified' ? ' ⚠️链接待核' : '');
const rel = (from, to) => path.relative(path.dirname(from), to).split(path.sep).join('/');
// 同标题+同城市合并为一行（多个团队在招）
function group(l) { const m = new Map();
  for (const j of l) { const k = j.company_slug + '|' + j.title + '|' + [...j.city].sort().join('/'); (m.get(k) || m.set(k, []).get(k)).push(j); }
  return [...m.values()].map(g => ({ ...g[0], ids: g.map(x => x.id), is_new: g.some(x => x.is_new), link_status: g.every(x => x.link_status === 'unverified') ? 'unverified' : g[0].link_status }));
}
const written = []; // {path, bytes, count}
function out(rp, text, count) { const f = path.join(SITE, rp); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); written.push({ path: rp, bytes: Buffer.byteLength(text), count }); }
// 分页写列表：每页 ≤ MAX 字节；返回页路径
function paged(base, title, note, rows, withCo, count) {
  const head = withCo ? '| 公司 | 岗位 | 城市 | 首次出现 | 详情 |\n|---|---|---|---|---|' : '| 岗位 | 城市 | 首次出现 | 详情 |\n|---|---|---|---|';
  const pages = []; let cur = [];
  const render = (rs, i, n, file) => [`# ${title}${n > 1 ? `（第 ${i}/${n} 页）` : ''}`, '', note, '', head,
    ...rs.map(g => { const links = g.ids.map((id, k) => `[${g.ids.length > 1 ? k + 1 : '详情'}](${rel(file, `jobs/${id}.md`)})`).join(' ');
      return `| ${withCo ? esc(g.company) + ' | ' : ''}${esc(g.title)}${g.ids.length > 1 ? `（${g.ids.length}个团队）` : ''}${flag(g)} | ${esc(g.city.join('/'))} | ${g.first_seen} | ${links} |`; }),
    '', '{{NAV}}', ''].join('\n');
  const fname = i => `${base}${i > 1 ? `-p${i}` : ''}.md`;
  for (const r of rows) { const t = [...cur, r]; if (cur.length && Buffer.byteLength(render(t, 99, 99, fname(99))) > MAX - 300) { pages.push(cur); cur = [r]; } else cur = t; }
  if (cur.length || !pages.length) pages.push(cur);
  pages.forEach((rs, k) => { const i = k + 1, f = fname(i);
    const nav = [i > 1 ? `[上一页](${rel(f, fname(i - 1))})` : '', i < pages.length ? `[下一页](${rel(f, fname(i + 1))})` : '', `[总目录](${rel(f, 'llms.txt')})`].filter(Boolean).join(' · ');
    out(f, render(rs, i, pages.length, f).replace('{{NAV}}', nav), k === 0 ? count : 0); });
  return pages.map((_, k) => fname(k + 1));
}
const NOTE = `数据周 ${cur}，生成 ${today}（北京时间）。🆕=本周新增；⚠️链接待核=投递链接未通过自动校验；❌疑似下架=官网详情接口查不到，请到官网核实。截止日期以官网为准。`;

// 历史 changes/ 保留（其余全部重建）
const CH = path.join(SITE, 'changes'), oldChanges = fs.existsSync(CH) ? fs.readdirSync(CH).filter(f => !f.startsWith(cur)).map(f => [f, fs.readFileSync(path.join(CH, f), 'utf8')]) : [];
fs.rmSync(SITE, { recursive: true, force: true }); fs.mkdirSync(CH, { recursive: true });
for (const [f, t] of oldChanges) fs.writeFileSync(path.join(CH, f), t);
const byTitle = (a, b) => b.first_seen.localeCompare(a.first_seen) || a.title.localeCompare(b.title, 'zh');
const index = { week: cur, previous_week: prev, generated_at: today, max_bytes: MAX, count: jobs.length, removed_count: removed.length, companies: {}, slices: [], by_city: [], changes: [], jobs: 0 };
const companies = [...new Set(jobs.map(j => j.company_slug))].sort();
const names = Object.fromEntries(jobs.map(j => [j.company_slug, j.company]));

// slices/{company}/{campus|intern}/{category}/{city}.md
for (const co of companies) {
  const cj = jobs.filter(j => j.company_slug === co);
  index.companies[co] = { name: names[co], total: cj.length, campus: cj.filter(j => j.job_type === '校招').length, intern: cj.filter(j => j.job_type === '实习').length, new: cj.filter(j => j.is_new).length };
  for (const [jt, ts] of Object.entries(TYPES)) for (const [c, cs] of Object.entries(CATS)) {
    const l = cj.filter(j => j.job_type === jt && j.category === c); if (!l.length) continue;
    const cities = {};
    for (const j of l) for (const cy of (j.city.length ? j.city : ['未知'])) (cities[citySlug(cy)] ||= { names: new Set(), l: [] }).l.push(j), cities[citySlug(cy)].names.add(cy);
    for (const [cyS, v] of Object.entries(cities)) {
      const pages = paged(`slices/${co}/${ts}/${cs}/${cyS}`, `${names[co]} · ${jt} · ${c} · ${cyS === 'other' ? '其他城市：' + [...v.names].join('/') : cityName(cyS)}（${v.l.length} 个岗位）`, NOTE, group(v.l.sort(byTitle)), false, v.l.length);
      index.slices.push({ company: co, job_type: ts, category: cs, city: cyS, city_name: cityName(cyS), count: v.l.length, pages });
    }
  }
}
// by-city/{city}/{campus-|intern-}{category}.md（跨公司）
const cityAll = {};
for (const j of jobs) for (const cy of (j.city.length ? j.city : ['未知'])) (cityAll[citySlug(cy)] ||= { names: new Set(), l: [] }).l.push(j), cityAll[citySlug(cy)].names.add(cy);
for (const [cyS, v] of Object.entries(cityAll)) for (const [jt, ts] of Object.entries(TYPES)) for (const [c, cs] of Object.entries(CATS)) {
  const l = v.l.filter(j => j.job_type === jt && j.category === c); if (!l.length) continue;
  const byCo = {}; for (const j of l) byCo[j.company_slug] = (byCo[j.company_slug] || 0) + 1;
  const base = `by-city/${cyS}/${ts}-${cs}`;
  const dist = '按公司：' + Object.entries(byCo).sort((a, b) => b[1] - a[1]).map(([co, n]) => `[${names[co]} ${n}](${rel(base + '.md', `slices/${co}/${ts}/${cs}/${cyS}.md`)})`).join(' · ')
    + '。岗位多时先看分布，再点公司链接缩小范围，不必读完所有分页。';
  const pages = paged(base, `${cityName(cyS)} · ${jt} · ${c} · 全部公司（${l.length} 个岗位）`, NOTE + '\n\n' + dist,
    group(l.sort((a, b) => a.company_slug.localeCompare(b.company_slug) || byTitle(a, b))), true, l.length);
  index.by_city.push({ city: cyS, city_name: cityName(cyS), job_type: ts, category: cs, count: l.length, pages });
}
// changes/{week}.md
{ const nw = jobs.filter(j => j.is_new);
  const rows = [...nw.map(j => ({ ...j, title: '🆕 ' + j.title, ids: [j.id], is_new: false })), ...removed.map(j => ({ ...j, title: '❌下架 ' + j.title, ids: [j.id] }))];
  const note = prev ? `${cur} 相比 ${prev}：新增 ${nw.length}，下架 ${removed.length}。下架岗位详情页保留，status=removed。` : `${cur} 是首个数据周（基线），不列新增；共 ${jobs.length} 个在招岗位。`;
  const pages = paged(`changes/${cur}`, `本周变化 ${cur}`, note, prev ? rows : [], true, rows.length);
  index.changes.push({ week: cur, new: nw.length, removed: removed.length, pages }); }

// jobs/{id}.md：在招 + 历史下架（从最近含该 id 的周数据重建）
const cache = {}; const findOld = id => { for (const w of [...weeks].reverse()) { const m = cache[w] ||= dedup(load(w))[0]; if (m.has(id)) return m.get(id); } };
const detail = (j, s) => { const f = `jobs/${j.id}.md`; out(f, [`# ${j.title}`, '',
  `- id: ${j.id}`, `- 公司: ${j.company}${j.business_unit.length ? `（${j.business_unit.join('、')}）` : ''}`, `- job_type: ${j.job_type}`, `- 类别: ${j.category}`,
  `- 城市: ${j.city.join('、') || '未知'}`, `- status: ${s.status}${s.status === 'removed' ? `（${s.removed_at} 起未在官网出现，勿投）` : ''}`,
  `- 首次出现: ${s.first_seen}　最近出现: ${s.last_seen || '-'}`, `- 截止: ${j.deadline || '以官网为准'}`,
  `- 投递: ${j.apply_url}${(linkStatus[j.id]?.status) === 'invalid' ? '（❌疑似下架：官网详情接口查不到该岗位）' : (linkStatus[j.id]?.status) === 'unverified' ? '（⚠️链接待核：自动校验未通过，请到官网搜索岗位名）' : ''}`, '',
  '## 岗位要求', '', String(j.requirements || '（官网未提供）').trim(), '', `[总目录](${rel(f, 'llms.txt')})`, ''].join('\n'), 1); };
for (const j of jobs) detail(j, st.jobs[j.id]);
for (const [id, s] of Object.entries(st.jobs)) if (s.status === 'removed') { const j = findOld(id); if (j) detail(j, s); }
index.jobs = written.filter(w => w.path.startsWith('jobs/')).length;

// llms.txt（总目录，~3KB）
const cnt = (co, ts, cs) => index.slices.filter(s => s.company === co && s.job_type === ts && s.category === cs).length;
const cityCounts = Object.entries(cityAll).map(([k, v]) => [k, cityName(k), v.l.length]).sort((a, b) => b[2] - a[2]);
const llms = [`# 大厂 AI产品/产品/运营 校招·实习 JD 库`, '',
  `> 每周一由 GitHub Actions 预计算的静态切片。数据周 ${cur}，${today} 生成。在招 ${jobs.length}，本周新增 ${jobs.filter(j => j.is_new).length}，下架 ${removed.length}。所有路径相对本文件所在目录；每个文件 ≤8KB，超出分页 -p2、-p3。`, '',
  '## 怎么读', '1. 选一个最窄的文件 fetch：有公司就用 slices，只有城市就用 by-city。', '2. 列表里每行有 [详情] 链接 → jobs/{id}.md（含 job_type、status、岗位要求、投递链接）。', '3. 不要猜路径；路径不在下面或 index.json 里就是没有岗位。', '4. by-city 文件多页时，第 1 页开头有「按公司」分布及各公司切片链接：先按用户偏好的公司缩小，或只读前 1～2 页并告诉用户总数。', '5. 用户同时要校招和实习、多个城市时，每个组合各读一个文件（例：北京+上海 × 校招+实习 = 4 个文件）。', '',
  '## 路径模板', '- slices/{company}/{campus|intern}/{category}/{city}.md', '- by-city/{city}/{campus|intern}-{category}.md', `- changes/${cur}.md（本周新增/下架）`, '- jobs/{company}-{postId}.md', '- index.json（全部文件清单与计数）', '',
  '## 枚举', `- category: ai-product=AI产品, product=产品, operations=运营`, '- job_type: campus=校招, intern=实习',
  `- city: ${cityCounts.map(([k, n, c]) => `${k}=${n}(${c})`).join(', ')}`, '',
  '## 公司（校招/实习 岗位数）', ...companies.map(co => `- ${co}=${names[co]}：校招 ${index.companies[co].campus}，实习 ${index.companies[co].intern}`), ''].join('\n');
out('llms.txt', llms, 0);
index.files = written.length + 1;
out('index.json', JSON.stringify(index), 0);

// README 总览表（标记之间）
const RM = path.join(ROOT, 'README.md');
if (fs.existsSync(RM)) { const r = fs.readFileSync(RM, 'utf8'), A = '<!-- overview:start -->', B = '<!-- overview:end -->';
  if (r.includes(A)) { const tbl = [`数据周 **${cur}**（${today} 生成）· 在招 **${jobs.length}** · 本周新增 **${jobs.filter(j => j.is_new).length}** · 下架 **${removed.length}**`, '',
    '| 公司 | 校招 | 实习 | 合计 |', '|---|---:|---:|---:|', ...companies.map(co => `| ${names[co]} | ${index.companies[co].campus} | ${index.companies[co].intern} | ${index.companies[co].total} |`)].join('\n');
    fs.writeFileSync(RM, r.slice(0, r.indexOf(A) + A.length) + '\n' + tbl + '\n' + r.slice(r.indexOf(B))); } }

// ---------- 校验 ----------
const errs = [];
const big = written.filter(w => w.path !== 'index.json' && w.bytes > MAX); if (big.length) errs.push(`超过 8KB：${big.map(b => b.path + ' ' + b.bytes).join(', ')}`);
const ids = jobs.map(j => j.id); if (new Set(ids).size !== ids.length) errs.push('id 不唯一');
if (ids.some(i => /-undefined$/.test(i))) errs.push('存在无 postId 的 id');
for (const co of companies) for (const ts of Object.values(TYPES)) for (const cs of Object.values(CATS)) {
  const want = jobs.filter(j => j.company_slug === co && TYPES[j.job_type] === ts && CATS[j.category] === cs).length;
  const sl = index.slices.filter(s => s.company === co && s.job_type === ts && s.category === cs);
  // 城市切片按 id 求并集应等于该组岗位数
  const u = new Set(); for (const s of sl) for (const p of s.pages) for (const m of fs.readFileSync(path.join(SITE, p), 'utf8').matchAll(/jobs\/([a-z0-9_-]+)\.md/g)) u.add(m[1]);
  if (u.size !== want) errs.push(`计数不一致 ${co}/${ts}/${cs}: 数据 ${want}，切片 ${u.size}`);
}
const missing = ids.filter(id => !fs.existsSync(path.join(SITE, 'jobs', id + '.md'))); if (missing.length) errs.push(`缺详情页 ${missing.length}`);
const maxf = written.filter(w => w.path !== 'index.json').sort((a, b) => b.bytes - a.bytes)[0];
console.log(`build ${cur} vs ${prev || '-'}: ${jobs.length} jobs, ${dup} dup dropped, ${removed.length} removed, ${written.length} files; 最大 md ${maxf.path} ${maxf.bytes}B; llms.txt ${written.find(w => w.path === 'llms.txt').bytes}B; index.json ${written.at(-1).bytes}B`);
for (const co of companies) console.log(' ', co, JSON.stringify(index.companies[co]));
if (issues.length) { console.log(`数据问题 ${issues.length}：`); issues.slice(0, 20).forEach(i => console.log('  ' + i)); }
if (errs.length) { console.error('校验失败：\n  ' + errs.join('\n  ')); process.exit(1); }
console.log('校验通过：所有文件 ≤8KB（index.json 除外）、id 唯一、切片计数一致');
