#!/usr/bin/env node
// 读取最新两周 data/，生成 README.md 与 jobs/latest.json。无外部依赖。
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DATA = path.join(ROOT, 'data');
const CATS = ['AI产品', '产品', '运营'];
const weeks = fs.readdirSync(DATA).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort();
if (!weeks.length) { console.error('data/ 下没有周目录'); process.exit(1); }
const cur = weeks.at(-1), prev = weeks.at(-2);
const load = w => w ? fs.readdirSync(path.join(DATA, w)).filter(f => f.endsWith('.json')).flatMap(f => {
  const arr = JSON.parse(fs.readFileSync(path.join(DATA, w, f), 'utf8'));
  if (!Array.isArray(arr)) throw new Error(`${w}/${f} 不是数组`);
  for (const j of arr) {
    for (const k of ['company','title','category','city','apply_url']) if (j[k] == null) throw new Error(`${w}/${f} 缺字段 ${k}: ${j.title}`);
    if (!CATS.includes(j.category)) throw new Error(`${w}/${f} 非法类别 ${j.category}`);
    if (j.deadline != null && !/^\d{4}-\d{2}-\d{2}$/.test(j.deadline)) throw new Error(`${w}/${f} 日期格式错误 ${j.deadline}`);
  }
  return arr;
}) : [];
const key = j => j.apply_url || `${j.company}::${j.title}`;
const jobs = load(cur), prevKeys = new Set(load(prev).map(key));
const today = process.env.BUILD_DATE || new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // 北京时间
const days = d => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
for (const j of jobs) j.is_new = !prevKeys.has(key(j));
jobs.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.company.localeCompare(b.company));

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const row = j => `| ${esc(j.company)} | ${esc(j.title)}${j.example ? ' `示例`' : ''} | ${esc(j.city.join('/'))} | ${j.deadline || '未注明'} | [投递](${j.apply_url}) |`;
const table = l => l.length ? ['| 公司 | 岗位 | 城市 | 截止 | 链接 |', '|---|---|---|---|---|', ...l.map(row)].join('\n') : '_无_';
const newJobs = jobs.filter(j => j.is_new);
const soon = jobs.filter(j => j.deadline && days(j.deadline) >= 0 && days(j.deadline) <= 7);
const md = [
  '# 大厂 AI / 产品 / 运营岗秋招 JD 库（每周更新）', '',
  `> 数据周：**${cur}**　生成日期：${today}（北京时间）　共 ${jobs.length} 个岗位，覆盖 ${new Set(jobs.map(j => j.company)).size} 家公司`,
  jobs.some(j => j.example) ? '>\n> ⚠️ 标 `示例` 的条目为占位假数据，不是真实岗位。' : '', '',
  '机器可读数据：[`jobs/latest.json`](jobs/latest.json)　给 Agent 用的 skill：[`skill/SKILL.md`](skill/SKILL.md)', '',
  `## 🆕 本周新增（${newJobs.length}）`, prev ? `对比上一周 ${prev}。` : '没有上一周数据，本周全部视为新增。', '', table(newJobs), '',
  `## ⏰ 7 天内截止（${soon.length}）`, '', table(soon), '',
  '## 全部岗位（按类别）', '',
  ...CATS.flatMap(c => { const l = jobs.filter(j => j.category === c); return [`### ${c}（${l.length}）`, '', table(l), '']; }),
  '---', '数据只取自各公司校招官网的公开页面，以官网为准。字段说明见 [data/SCHEMA.md](data/SCHEMA.md)。', ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'README.md'), md);
fs.mkdirSync(path.join(ROOT, 'jobs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'jobs/latest.json'), JSON.stringify({ week: cur, previous_week: prev || null, generated_at: today, count: jobs.length, jobs }, null, 2) + '\n');
console.log(`build ok: ${cur}, ${jobs.length} jobs, ${newJobs.length} new, ${soon.length} due in 7d`);
