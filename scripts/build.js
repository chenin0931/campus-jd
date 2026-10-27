#!/usr/bin/env node
// 读取最新两周 data/，生成 README.md（总览）、jobs/<company>/*.md 分表、jobs/latest.json、jobs/removed.md；
// 维护 data/state.json（first_seen）。无外部依赖。不修改 data/<周>/ 下的数据文件。
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DATA = path.join(ROOT, 'data'), JOBS = path.join(ROOT, 'jobs');
const CATS = ['AI产品', '产品', '运营'], TYPES = ['校招', '实习'];
const weeks = fs.readdirSync(DATA).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort();
if (!weeks.length) { console.error('data/ 下没有周目录'); process.exit(1); }
const cur = weeks.at(-1), prev = weeks.at(-2);
const issues = [];
const load = w => w ? fs.readdirSync(path.join(DATA, w)).filter(f => f.endsWith('.json')).sort().flatMap(f => {
  const slug = f.replace(/\.json$/, '');
  const arr = JSON.parse(fs.readFileSync(path.join(DATA, w, f), 'utf8'));
  if (!Array.isArray(arr)) throw new Error(`${w}/${f} 不是数组`);
  return arr.map(j => {
    for (const k of ['company', 'title', 'category', 'apply_url']) if (!j[k]) issues.push(`${w}/${f} 缺 ${k}: ${j.title}`);
    if (!CATS.includes(j.category)) issues.push(`${w}/${f} 非法类别 ${j.category}: ${j.title}`);
    if (j.deadline != null && !/^\d{4}-\d{2}-\d{2}$/.test(j.deadline)) issues.push(`${w}/${f} 日期格式错误 ${j.deadline}`);
    let jt = j.job_type ?? j.type, inferred = false;
    if (!TYPES.includes(jt)) { jt = /实习/.test(j.title || '') ? '实习' : '校招'; inferred = true; }
    return { ...j, company_slug: slug, city: Array.isArray(j.city) ? j.city : (j.city ? [j.city] : []), job_type: jt, ...(inferred ? { job_type_inferred: true } : {}) };
  });
}) : [];
const key = j => j.apply_url || `${j.company_slug}::${j.title}`;
const today = process.env.BUILD_DATE || new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const days = d => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);

// 去重（同 key 只保留第一条）
const seen = new Set(); let dup = 0;
const jobs = load(cur).filter(j => seen.has(key(j)) ? (dup++, false) : seen.add(key(j)));
const prevJobs = load(prev), prevKeys = new Set(prevJobs.map(key));
const removed = prevJobs.filter(j => !seen.has(key(j))).map(j => ({ ...j, status: '已下架' }));

// first_seen 状态
const STATE = path.join(DATA, 'state.json');
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { first_seen: {} };
for (const j of jobs) { state.first_seen[key(j)] ??= today; j.first_seen = state.first_seen[key(j)]; j.is_new = !prevKeys.has(key(j)); }
state.updated_at = today;
fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');

const byDl = (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.title.localeCompare(b.title, 'zh');
jobs.sort((a, b) => a.company_slug.localeCompare(b.company_slug) || byDl(a, b));
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const tag = j => (j.example ? ' `示例`' : '') + (j.is_new ? ' 🆕' : '');
const table = (l, withCo) => l.length ? [
  `| ${withCo ? '公司 | ' : ''}岗位 | 城市 | 截止 | 首次出现 | 链接 |`, `|${withCo ? '---|' : ''}---|---|---|---|---|`,
  ...l.map(j => `| ${withCo ? esc(j.company) + ' | ' : ''}${esc(j.title)}${tag(j)} | ${esc(j.city.join('/'))} | ${j.deadline || '见官网'} | ${j.first_seen || '-'} | [投递](${j.apply_url}) |`)
].join('\n') : '_无_';
const fileOf = (jt, c) => jt === '实习' ? `实习-${c}.md` : `${c}.md`;
const enc = p => p.split('/').map(encodeURIComponent).join('/');

// 分表
fs.rmSync(JOBS, { recursive: true, force: true }); fs.mkdirSync(JOBS, { recursive: true });
const companies = [...new Set(jobs.map(j => j.company_slug))];
const names = Object.fromEntries(jobs.map(j => [j.company_slug, j.company]));
for (const co of companies) {
  fs.mkdirSync(path.join(JOBS, co), { recursive: true });
  for (const jt of TYPES) for (const c of CATS) {
    const l = jobs.filter(j => j.company_slug === co && j.category === c && j.job_type === jt).sort(byDl);
    if (!l.length) continue;
    fs.writeFileSync(path.join(JOBS, co, fileOf(jt, c)), [`# ${names[co]} · ${jt} · ${c}（${l.length}）`, '',
      `数据周 ${cur}，生成于 ${today}。截止“见官网”表示官网未注明。🆕 = 本周新增。[返回总览](../../README.md)`, '', table(l), ''].join('\n'));
  }
}
fs.writeFileSync(path.join(JOBS, 'latest.json'), JSON.stringify({ week: cur, previous_week: prev || null, generated_at: today, count: jobs.length, removed_count: removed.length, jobs, removed }, null, 1) + '\n');
fs.writeFileSync(path.join(JOBS, 'removed.md'), [`# 已下架岗位（${removed.length}）`, '', prev ? `${prev} 有、${cur} 没有。` : '没有上一周数据。', '', table(removed, true), ''].join('\n'));

// README 总览
const newJobs = jobs.filter(j => j.is_new);
const soon = jobs.filter(j => j.deadline && days(j.deadline) >= 0 && days(j.deadline) <= 7).sort(byDl);
const cnt = (co, c, jt) => jobs.filter(j => j.company_slug === co && j.category === c && j.job_type === jt).length;
const cell = (co, c, jt) => { const n = cnt(co, c, jt); return n ? `[${n}](${enc(`jobs/${co}/${fileOf(jt, c)}`)})` : '0'; };
const exampleCos = [...new Set(jobs.filter(j => j.example).map(j => names[j.company_slug]))];
const md = [
  '# 大厂 AI / 产品 / 运营岗秋招 JD 库（每周更新）', '',
  `> 数据周：**${cur}**　生成：${today}（北京时间）　在招 **${jobs.length}** 个岗位 · 本周新增 **${newJobs.length}** · 已下架 **${removed.length}**`,
  exampleCos.length ? `>\n> ⚠️ 以下公司目前仍是**示例假数据**：${exampleCos.join('、')}` : '', '',
  '## 总览（点数字进分表）', '',
  `| 公司 | ${TYPES.flatMap(t => CATS.map(c => `${t}·${c}`)).join(' | ')} | 合计 | 本周新增 |`,
  `|---|${TYPES.flatMap(() => CATS.map(() => '---:')).join('|')}|---:|---:|`,
  ...companies.map(co => `| ${esc(names[co])}${exampleCos.includes(names[co]) ? ' `示例`' : ''} | ${TYPES.flatMap(t => CATS.map(c => cell(co, c, t))).join(' | ')} | ${jobs.filter(j => j.company_slug === co).length} | ${newJobs.filter(j => j.company_slug === co).length} |`), '',
  prev ? `本周新增按 apply_url 对比 ${prev}。` : '没有上一周数据，本周全部视为新增。', '',
  `## ⏰ 7 天内截止（${soon.length}）`, '', soon.length ? table(soon, true) : '_无（仅统计官网注明截止日期的岗位）_', '',
  `## 📦 已下架（${removed.length}）`, '', removed.length ? `完整列表见 [jobs/removed.md](jobs/removed.md)。` : '_无_', '',
  '## 数据', '', '- 全量机器可读：[`jobs/latest.json`](jobs/latest.json)', '- 给 Agent 的 skill：[`skill/SKILL.md`](skill/SKILL.md)',
  '- 字段说明：[`data/SCHEMA.md`](data/SCHEMA.md)', '', '数据只取自各公司校招官网的公开页面，以官网为准。', ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'README.md'), md);

const inf = jobs.filter(j => j.job_type_inferred).length;
console.log(`build ok: ${cur} vs ${prev || '-'} | ${jobs.length} jobs, ${newJobs.length} new, ${removed.length} removed, ${soon.length} due in 7d, ${dup} dup dropped, ${inf} job_type inferred`);
for (const co of companies) console.log(' ', co, TYPES.map(t => t + ':' + CATS.map(c => c + '=' + cnt(co, c, t)).join(',')).join(' | '));
if (issues.length) { console.log(`数据问题 ${issues.length} 条：`); issues.slice(0, 20).forEach(i => console.log('  ' + i)); }
