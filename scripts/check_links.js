#!/usr/bin/env node
// 链接校验：对最新周 data 的 apply_url 并发 GET，结果写 data/link_status.json：{ id: { status, code, checked_at } }
// status: ok = HTTP<400 且页面内容随 id 变化；unverified = 失败/超时/≥400，或 URL 含 #（前端路由，服务端无法判断岗位是否存在）。
// 用法：node scripts/check_links.js [--only kuaishou,meituan,xiaohongshu] [--concurrency 16]
const fs = require('fs'), path = require('path');
const { args } = require('./lib/common'), { postId } = require('./lib/site');
const DATA = path.join(__dirname, '..', 'data'), a = args();
const week = fs.readdirSync(DATA).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort().at(-1);
const only = a.only ? new Set(String(a.only).split(',')) : null, N = +(a.concurrency || 16);
const OUT = path.join(DATA, 'link_status.json');
const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const todo = [];
for (const f of fs.readdirSync(path.join(DATA, week)).filter(f => f.endsWith('.json'))) {
  const slug = f.slice(0, -5); if (only && !only.has(slug)) continue;
  for (const j of JSON.parse(fs.readFileSync(path.join(DATA, week, f), 'utf8'))) todo.push({ id: `${slug}-${postId(j.apply_url)}`, url: j.apply_url });
}
const UA = { 'User-Agent': 'Mozilla/5.0 (campus-jd link check)' };
// SPA 外壳检测：把 URL 中的 postId 换成不存在的 1 再取一次；若两者状态码和正文长度几乎相同，说明服务端对任何 id 都返回同一外壳，无法确认岗位 → unverified
const probes = {};
const get = async u => { const r = await fetch(u, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(15e3) }); return { code: r.status, len: (await r.text()).length }; };
async function check(u) {
  if (u.includes('#')) return { status: 'unverified', code: 'hash-route' };
  try {
    const r = await get(u); if (r.code >= 400) return { status: 'unverified', code: r.code };
    const fake = u.replace(/(\d{3,})(?!.*\d{3,})/, '1'), host = new URL(u).host;
    const p = await (probes[host] ||= get(fake).catch(() => null));
    if (p && p.code === r.code && Math.abs(p.len - r.len) <= Math.max(64, r.len * 0.01)) return { status: 'unverified', code: 'spa-shell' };
    return { status: 'ok', code: r.code };
  } catch (e) { return { status: 'unverified', code: e.name }; }
}
(async () => {
  let i = 0; const now = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00';
  await Promise.all(Array.from({ length: N }, async () => { while (i < todo.length) { const t = todo[i++]; res[t.id] = { ...(await check(t.url)), checked_at: now }; } }));
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n');
  const sum = {}; for (const t of todo) { const k = t.id.split('-')[0] + ':' + res[t.id].status + ':' + res[t.id].code; sum[k] = (sum[k] || 0) + 1; }
  console.log(`checked ${todo.length} links (${week})`, sum);
})();
