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
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'; // 华为网关无浏览器 UA 会 403
// 单家并发上限（B站请求过密会断连）
const LIMIT = { bilibili: 2 };
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
      if (b.code === 200) return !!b.data?.id; if (b.code === 402) return false; /* 402「职位失效或者不存在」：真实下架岗位（72095，2026-10-27）返回此码 */ if (b.code === 500 && b.data == null) throw Object.assign(new Error('netease-500'), { pending: true }); throw new Error('code ' + b.code); }
    const b = await (await fetch(`https://${h}/api/campuspc/position/getJobDetails?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 200) return !!b.data; throw Object.assign(new Error('code ' + b.code), { pending: true }); },
  // —— 2026-W44 新增 7 家（staging/2026-W44），均已用全量真 id + 假 id 验过 ——
  // 得物：飞书 SaaS（假 id → code 0 但无 job_post_detail → false），但 website-path 是 578078（check_links.js 里的 feishu() 写死 'campus'，不能直接复用）。
  dewu: (() => { const base = 'https://campus.dewu.com', H = { ...J, 'portal-channel': 'saas-career', 'website-path': '578078', Referer: `${base}/578078/position/list` }; let tok;
    return async pid => {
      tok ||= (async () => { const r = await fetch(`${base}/api/v1/csrf/token`, { method: 'POST', headers: H, body: '{"portal_entrance":1}', signal: T() });
        return { cookie: r.headers.getSetCookie().map(c => c.split(';')[0]).join('; '), t: (await r.json()).data.token }; })();
      const { cookie, t } = await tok;
      const r = await fetch(`${base}/api/v1/job/posts/${pid}?portal_type=6&with_recommend=false`, { headers: { ...H, 'x-csrf-token': t, cookie }, signal: T() });
      if (!r.ok) throw new Error('http ' + r.status); const b = await r.json();
      if (b.code === 0) return !!b.data?.job_post_detail?.id; throw new Error('code ' + b.code); }; })(),
  // 米哈游：不存在 → code 1080001052。
  mihoyo: async pid => { const b = await (await fetch('https://ats.openout.mihoyo.com/ats-portal/v1/job/info', { method: 'POST', headers: J, body: JSON.stringify({ id: String(pid), channelDetailIds: [1], hireType: 1 }), signal: T() })).json();
    if (b.code === 0) return !!b.data?.id; if (b.code === 1080001052) return false; throw new Error('code ' + b.code); },
  // 携程：岗位 id 形如 MJ037349，postId() 只会取到 037349，所以从 url 里取完整 id。不存在 → total 0。
  ctrip: async (pid, url) => { const id = (String(url).match(/job-detail\/([^/?#]+)/) || [])[1] || pid;
    const b = await (await fetch('https://careers.ctrip.com/api/hrrecruit/getJobAd', { method: 'POST', headers: J, body: JSON.stringify({ condition: { fromId: [id] }, pager: { index: '1', size: '10' } }), signal: T() })).json();
    const v = b.retValue; if (!v) throw new Error('ctrip no retValue'); return (v.total ?? v.list?.length ?? 0) > 0; },
  // OPPO：有效 id → code 0 + positionStatus（0 在招，1 关闭）；不存在 → code 500 "未知的系统错误"（通用码，但仅在 id 不存在时出现）。
  oppo: async pid => { const b = await (await fetch(`https://careers.oppo.com/openapi/position/detail?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 0 && b.data) return b.data.positionStatus === 0; if (b.code === 500) return false; throw new Error('code ' + b.code); },
  // vivo（北森 hr-campus.vivo.com）：Code 200 且有 Data → ok；Data.Status 2 = 已关闭（页面跳 /job/empty）→ 疑似下架；Code 500「参数错误」→ 链接待核。
  vivo: async pid => { const b = await (await fetch(`https://hr-campus.vivo.com/api/JobAd/GetJobAdInfo?jobAdId=${pid}`, { headers: UA, signal: T() })).json();
    if (b.Code === 200 && b.Data) return b.Data.Status !== 2;   // Status 2 = 已关闭 → invalid（疑似下架）
    // 500「参数错误」：格式错误的 id 和格式正确但不存在的 GUID 返回完全一样，分不出是否下架 → 链接待核（同网易 500）
    if (b.Code === 500) throw Object.assign(new Error('vivo-500'), { pending: true }); throw new Error('Code ' + b.Code); },
  // 华为新站（apigw）：需站点前端同款头；不存在 → status SUCCESS + data null。
  huawei: async pid => { const b = await (await fetch('https://apigw-dgg-b0.huawei.com/api/apig/channelhw/recruitmentPosition/pub/getRecruitmentPositionDetail?X-HW-ID=app_000000035886', { method: 'POST',
      headers: { ...J, 'User-Agent': BROWSER_UA, Origin: 'https://career.huawei.com', Referer: 'https://career.huawei.com/cn/job-details', 'x-language': 'zh_CN', 'x-jalor-tenantAlias': 'hcm', 'X-HW-ID': 'app_000000035886', 'x-Referer': 'https://career.huawei.com/cn' },
      body: JSON.stringify({ advertisementId: String(pid) }), signal: T() })).json();
    if (b.status === 'SUCCESS') return !!b.data?.advertisementId; throw new Error('huawei ' + JSON.stringify(b.errors)); },
  // B站：先取 csrf token（站点前端固定头 X-AppKey: ops.ehr-api.auth / X-UserType: 2），再带 X-CSRF；不存在/下架 → code 60015。
  bilibili: (() => { const B = 'https://jobs.bilibili.com', H = { ...UA, 'X-AppKey': 'ops.ehr-api.auth', 'X-UserType': '2', Referer: `${B}/campus/positions` }; let tok;
    return async pid => { tok ||= fetch(`${B}/api/auth/v1/csrf/token`, { headers: H, signal: T() }).then(r => r.json()).then(b => b.data);
      const b = await (await fetch(`${B}/api/campus/position/detail/${pid}`, { headers: { ...H, 'X-CSRF': await tok }, signal: T() })).json();
      if (b.code === 0) return !!b.data?.id; if (b.code === 60015) return false; throw new Error('code ' + b.code); }; })(),
};
// 无法逐条校验的公司：统一链接待核
const PENDING = { didi: 'list-api-encrypted' };   // 滴滴列表接口加密，暂无逐条校验办法
const busy = {}, waitq = {};
const acquire = s => { if (!LIMIT[s]) return Promise.resolve(); if ((busy[s] || 0) < LIMIT[s]) { busy[s] = (busy[s] || 0) + 1; return Promise.resolve(); } return new Promise(r => (waitq[s] ||= []).push(r)); };
const release = s => { if (!LIMIT[s]) return; const n = waitq[s]?.shift(); if (n) n(); else busy[s]--; };
const check = async (u, slug) => { await acquire(slug); try { return await check0(u, slug); } finally { release(slug); } };
async function check0(u, slug) {
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
  // 防误判：同一轮某家判 invalid 的超过 10 条或 20%，疑似限流/接口异常 → 整家 invalid 降级为待核，待人工抽查
  const by = {}; for (const t of todo) { const c = t.id.split('-')[0]; (by[c] ||= { n: 0, bad: [] }).n++; if (res[t.id].status === 'invalid') by[c].bad.push(t.id); }
  for (const [c, v] of Object.entries(by)) if (v.bad.length > 10 || (v.bad.length && v.bad.length / v.n > 0.2)) {
    console.warn(`⚠️ ${c}: ${v.bad.length}/${v.n} 判下架，超阈值，降级为待核，请浏览器抽查`);
    for (const id of v.bad) res[id] = { ...res[id], status: 'unverified', code: 'mass-invalid-review' }; }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n');
  const sum = {}; for (const t of todo) { const k = t.id.split('-')[0] + ':' + res[t.id].status + ':' + res[t.id].code; sum[k] = (sum[k] || 0) + 1; }
  console.log(`checked ${todo.length} links (${week})`, sum);
})();
