#!/usr/bin/env node
// 链接校验：对最新周 data 的 apply_url 并发 GET，结果写 data/link_status.json：{ id: { status, code, checked_at } }
// status: ok(detail-api) = 详情接口返回岗位；invalid = 详情接口空/已下架；format_verified = 符合已人工确认的前端路由格式（见 FORMATS）；ok = HTTP<400 且页面内容随 id 变化；unverified = 失败/超时/≥400，或 URL 含 #（前端路由，服务端无法判断岗位是否存在）。
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
  for (const j of JSON.parse(fs.readFileSync(path.join(DATA, week, f), 'utf8'))) todo.push({ slug, id: `${slug}-${postId(j.apply_url)}`, url: j.apply_url });
}
const UA = { 'User-Agent': 'Mozilla/5.0 (campus-jd link check)' };
// SPA 外壳检测：把 URL 中的 postId 换成不存在的 1 再取一次；若两者状态码和正文长度几乎相同，说明服务端对任何 id 都返回同一外壳，无法确认岗位 → unverified
const probes = {};
// 经浏览器抽查确认的前端路由格式：URL 符合即 format_verified（格式正确，但服务端无法判断岗位是否仍在招，可用 check_links_browser.js 进一步验证）
const FORMATS = {
  kuaishou: /^https:\/\/campus\.kuaishou\.cn\/#\/campus\/job-info\/\d+$/,
  jd: /^https:\/\/campus\.jd\.com\/#\/details\?id=\d+$/,
  meituan: /^https:\/\/zhaopin\.meituan\.com\/web\/position\/detail\?jobUnionId=\d+(&highlightType=\w+)?$/,
  xiaohongshu: /^https:\/\/job\.xiaohongshu\.com\/campus\/position\/\d+$/,
  xiaomi: /^https:\/\/xiaomi\.jobs\.f\.mioffice\.cn\/campus\/position\/\d+\/detail$/,
};
const get = async u => { const r = await fetch(u, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(15e3) }); return { code: r.status, len: (await r.text()).length }; };
// —— 按 id 查详情接口（首选）。返回 true=在招，false=已下架/不存在（invalid），抛错=接口不可用→退回下面的格式/HTTP 校验。
// 插槽留给待补的公司：填入 async (postId, url) => boolean 即可。
const feishu = (base, channel, portal) => { let tok;
  const H = { 'Content-Type': 'application/json', 'portal-channel': channel, 'website-path': 'campus', Referer: `${base}/campus/position` };
  return async pid => {
    tok ||= (async () => { const r = await fetch(`${base}/api/v1/csrf/token`, { method: 'POST', headers: H, body: '{"portal_entrance":1}', signal: AbortSignal.timeout(15e3) });
      return { cookie: r.headers.getSetCookie().map(c => c.split(';')[0]).join('; '), t: (await r.json()).data.token }; })();
    const { cookie, t } = await tok;
    const r = await fetch(`${base}/api/v1/job/posts/${pid}?portal_type=${portal}&with_recommend=false`, { headers: { ...H, 'x-csrf-token': t, cookie }, signal: AbortSignal.timeout(15e3) });
    if (!r.ok) throw new Error('http ' + r.status);
    const b = await r.json(); if (b.code !== 0) throw new Error('code ' + b.code);
    return !!b.data?.job_post_detail?.id; }; };
const T = () => AbortSignal.timeout(15e3), J = { ...UA, 'Content-Type': 'application/json' };
// 抛出带 pending 的错误 = 接口给不出确定结论（如网易日常实习假 id 返回通用 500）→ 直接记 unverified（链接待核），不判下架、不回退。
const DETAIL = {
  tencent: async pid => { const r = await fetch(`https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?postId=${pid}`, { headers: UA, signal: AbortSignal.timeout(15e3) });
    const b = await r.json(); if (b.status === 0) return !!b.data?.postId; if (b.status === 404) return false; throw new Error('status ' + b.status); },
  bytedance: feishu('https://jobs.bytedance.com', 'campus', 3),
  xiaomi: feishu('https://xiaomi.jobs.f.mioffice.cn', 'saas-career', 6),
  // —— 以下来自 scripts/reference/detail_map_snippets.js（全网招聘内容搜罗 2026-10-27 用真/假 id 验过）
  kuaishou: async pid => { const b = await (await fetch(`https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/find?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 0) return !!b.result?.name; if (b.code === 40404) return false; throw new Error('code ' + b.code); },
  jd: async pid => { const b = await (await fetch(`https://campus.jd.com/api/wx/position/detail/${pid}`, { method: 'POST', headers: J, body: '{}', signal: T() })).json();
    if (!b.success) throw new Error('jd fail'); return !!b.body?.positionName; },
  meituan: async pid => { const b = await (await fetch('https://zhaopin.meituan.com/api/official/job/getJobDetail', { method: 'POST', headers: J, body: JSON.stringify({ jobUnionId: String(pid), jobShareType: '1' }), signal: T() })).json();
    if (b.status === 1) return !!b.data?.name; if (b.status === 0 && b.data == null) return false; throw new Error('status ' + b.status); },
  xiaohongshu: async pid => { const b = await (await fetch(`https://job.xiaohongshu.com/websiterecruit/position/queryPositionDetail?positionId=${pid}`, { headers: UA, signal: T() })).json();
    if (b.success) return !!b.data?.positionName; if (b.statusCode === 999) return false; throw new Error('code ' + b.statusCode); },
  antgroup: async pid => { const b = await (await fetch('https://hrcareersweb.antgroup.com/api/campus/position/detail', { method: 'POST', headers: { ...J, Origin: 'https://talent.antgroup.com', Referer: 'https://talent.antgroup.com/' },
      body: JSON.stringify({ id: Number(pid), channel: 'campus_group_official_site', language: 'zh' }), signal: T() })).json();
    if (!b.success) throw new Error('ant ' + b.errorCode); return !!b.content?.id; },
  // 阿里需先 GET 页面拿 XSRF-TOKEN cookie，再带 x-xsrf-token 头 + ?_csrf=；无 token 返回 403。
  alibaba: (() => { let tok; return async pid => {
    tok ||= (async () => { const r = await fetch('https://campus-talent.alibaba.com/campus/position', { headers: UA, signal: T() });
      const ck = r.headers.getSetCookie().map(c => c.split(';')[0]); return { cookie: ck.join('; '), t: (ck.find(c => c.startsWith('XSRF-TOKEN=')) || '').slice(11) }; })();
    const { cookie, t } = await tok;
    const r = await fetch(`https://campus-talent.alibaba.com/position/detail?_csrf=${t}`, { method: 'POST', headers: { ...J, cookie, 'x-xsrf-token': t, Referer: 'https://campus-talent.alibaba.com/campus/position' },
      body: JSON.stringify({ id: Number(pid), language: 'zh' }), signal: T() });
    if (!r.ok) throw new Error('http ' + r.status); const b = await r.json();
    if (!b.success) throw new Error('ali ' + b.errorCode); return !!b.content?.id; }; })(),
  baidu: async (pid, url) => { const rt = (String(url).match(/\/jobs\/detail\/([A-Z]+)\//) || [])[1] || 'GRADUATE';
    const b = await (await fetch(`https://talent.baidu.com/httservice/getPostDetail?postId=${pid}&recruitType=${rt}`, { headers: { ...UA, Referer: 'https://talent.baidu.com/jobs/list' }, signal: T() })).json();
    if (b.status === 'ok') return !!b.data?.postId; if (b.status === 'fail') return false; throw new Error('baidu ' + b.status); },
  // 网易三类链接：campus.163.com / campus.game.163.com（校招，getJobDetails：不存在 → code 200 + data null）；
  // hr.163.com/job-detail.html（日常实习，position/query：不存在 → code 500 "系统错误"，无专门不存在码）。
  netease: async (pid, url) => { const h = new URL(url).host;
    if (h === 'hr.163.com') { const b = await (await fetch(`https://hr.163.com/api/hr163/position/query?id=${pid}`, { headers: UA, signal: T() })).json();
      if (b.code === 200) return !!b.data?.id; if (b.code === 500 && b.data == null) throw Object.assign(new Error('netease-500'), { pending: true }); throw new Error('code ' + b.code); }
    const b = await (await fetch(`https://${h}/api/campuspc/position/getJobDetails?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 200) return !!b.data; throw Object.assign(new Error('code ' + b.code), { pending: true }); },
};
// 无法逐条校验的公司：统一链接待核
const PENDING = { didi: 'list-api-encrypted' };   // 滴滴列表接口加密，暂无逐条校验办法
async function check(u, slug) {
  if (PENDING[slug]) return { status: 'unverified', code: PENDING[slug] };
  if (DETAIL[slug]) try { return (await DETAIL[slug](postId(u), u)) ? { status: 'ok', code: 'detail-api' } : { status: 'invalid', code: 'detail-api-empty' }; }
    catch (e) { if (e.pending) return { status: 'unverified', code: 'detail-api-ambiguous' }; /* 其它接口异常 → 退回 */ }
  if (FORMATS[slug]) return FORMATS[slug].test(u) ? { status: 'format_verified', code: 'format' } : { status: 'unverified', code: 'bad-format' };
  if (u.includes('#')) return { status: 'unverified', code: 'hash-route' };
  try {
    const r = await get(u); if (r.code >= 400) return { status: 'unverified', code: r.code };
    const fake = u.replace(/(\d{3,})(?!.*\d{3,})/, '1'), host = new URL(u).host;
    const p = await (probes[host] ||= get(fake).catch(() => null));
    if (p && p.code === r.code && Math.abs(p.len - r.len) <= Math.max(64, r.len * 0.01)) return { status: 'unverified', code: 'spa-shell' };
    return { status: 'ok', code: r.code };
  } catch (e) { return { status: 'unverified', code: e.name }; }
}
// --probe：每家取一个真 id + 一个假 id（99999999）验证判断逻辑，不写文件
if (a.probe) (async () => { const seen = new Set();
  for (const t of todo) { const k = t.slug + new URL(t.url).host; if (seen.has(k)) continue; seen.add(k); const pid = postId(t.url);
    const fake = t.url.replace(pid, '99999999');
    console.log(t.slug.padEnd(12), 'real', pid, JSON.stringify(await check(t.url, t.slug)), '| fake', JSON.stringify(await check(fake, t.slug))); } })();
else (async () => {
  let i = 0; const now = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00';
  await Promise.all(Array.from({ length: N }, async () => { while (i < todo.length) { const t = todo[i++]; res[t.id] = { ...(await check(t.url, t.slug)), checked_at: now }; } }));
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n');
  const sum = {}; for (const t of todo) { const k = t.id.split('-')[0] + ':' + res[t.id].status + ':' + res[t.id].code; sum[k] = (sum[k] || 0) + 1; }
  console.log(`checked ${todo.length} links (${week})`, sum);
})();
