#!/usr/bin/env node
// 一次性合并：全网（staging/2026-W44-wt）+ AI 初创（staging/2026-W44/startups_node）→ data/2026-W44
// 规则：JS 分类器 classifyJob 重算类别（null=技术岗，排除）；社招非实习丢弃；标 region；dataset=全网/初创；
// 跨来源去重（与已入库数据比较 同公司+同 postId，或 同公司+同标题+同城市，或 同链接；多城聚合的同公司同名岗也算重复——全网京东把 200+ 城的站长岗合成一条）；链接未核标 link_check=待核。
// 与大厂同公司（jd/pinduoduo）的全网增量写到 <slug>@全网.json（build 取 @ 前为 slug），避免被周跑抓取器覆盖。
// 用法：node scripts/merge_staging.js [--week 2026-W44] [--dry-run]
const fs = require('fs'), path = require('path');
const { classifyJob, normCities, dropSocial, args } = require('./lib/common');
const { tagRegion } = require('./lib/overseas');
const { postId } = require('./lib/site');
const a = args(), week = a.week || '2026-W44', ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'data', week);
const SRC = [['全网', path.join(ROOT, 'staging', `${week}-wt`)], ['初创', path.join(ROOT, 'staging', week, 'startups_node')]];
const normUrl = u => String(u || '').trim().replace(/^http:/, 'https:').replace(/[#?].*$/, x => x.startsWith('?') ? x : '').replace(/\/$/, '');
// 初创来源里不算初创的公司 → 归全网（运营助手 2026-11-03 定）
const TO_QW = new Set(['weibo', 'shopee', 'zhihu']);
const coKey = s => String(s || '').replace(/[（(].*?[)）]/g, '').trim();
let seen = { pid: new Set(), tc: new Set(), url: new Set(), t: new Set() };
const add = (slug, j, S = seen) => { const c = [...normCities(j.city)].sort().join('/'); S.pid.add(slug + '|' + postId(j.apply_url)); S.tc.add(coKey(j.company) + '|' + j.title.trim() + '|' + c); S.url.add(normUrl(j.apply_url) + '|' + j.title.trim()); S.t.add(slug + '|' + j.title.trim()); };
const dupOf = (slug, j) => { const c = [...normCities(j.city)].sort().join('/');
  return seen.pid.has(slug + '|' + postId(j.apply_url)) ? 'id' : seen.tc.has(coKey(j.company) + '|' + j.title.trim() + '|' + c) ? '公司+标题+城市' : seen.url.has(normUrl(j.apply_url) + '|' + j.title.trim()) ? '链接' : (j.city.length > 1 && seen.t.has(slug + '|' + j.title.trim())) ? '多城聚合同名岗' : null; };
// 已入库（大厂）先登记
const existing = new Set();
for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.json') && !f.includes('@'))) {
  const slug = f.slice(0, -5), L = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
  if (L.some(j => j.dataset && j.dataset !== '大厂')) { fs.unlinkSync(path.join(OUT, f)); continue; }  // 上次合并的产物，重跑时重写
  existing.add(slug); L.forEach(j => add(slug, j)); }
for (const f of fs.readdirSync(OUT).filter(f => f.includes('@'))) fs.unlinkSync(path.join(OUT, f));
const rep = {};
for (const [ds, dir] of SRC) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const slug = f.slice(0, -5), raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const r = rep[`${ds}/${slug}`] = { raw: raw.length, tech: 0, social: 0, dup: {}, kept: 0 };
  let L = raw.map(j => ({ ...j, city: normCities(j.city).length ? normCities(j.city) : ['城市见官网'] }));
  L = L.flatMap(j => { const cat = classifyJob(j.title, j.requirements); if (!cat) { r.tech++; return []; } return [{ ...j, category: cat }]; });
  const n = L.length; L = dropSocial(L); r.social = n - L.length;
  // 只和其他文件/来源比（同文件内同标题同城市=多团队在招，不算重复；同 id 由 build 去重）
  const mine = { pid: new Set(), tc: new Set(), url: new Set(), t: new Set() };
  L = tagRegion(L).flatMap(j => { const d = dupOf(slug, j); if (d) { r.dup[d] = (r.dup[d] || 0) + 1; return []; } add(slug, j, mine); return [j]; });
  for (const k of Object.keys(seen)) mine[k].forEach(x => seen[k].add(x));
  L = L.map(j => { const { link_status, id, project, ...k } = j; const ok = link_status === '正常' && k.source !== 'manual-browser';
    return { ...k, dataset: TO_QW.has(slug) ? '全网' : ds, link_check: ok ? '正常' : '待核' }; });
  r.kept = L.length; if (!L.length || a['dry-run']) continue;
  const file = path.join(OUT, existing.has(slug) ? `${slug}@${TO_QW.has(slug) ? '全网' : ds}.json` : `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(L, null, 2) + '\n');
}
console.log(JSON.stringify(rep));
