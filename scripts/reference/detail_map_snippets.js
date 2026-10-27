// Drop-in DETAIL entries for scripts/check_links.js (paste inside `const DETAIL = {...}`; relies on UA + AbortSignal there).
// Each: async (pid, url) => true (在招) | false (不存在/下架) | throw (接口异常 → 回退)。All verified 2026-10-27 with real + fake ids.
const T = () => AbortSignal.timeout(15e3), J = { ...UA, 'Content-Type': 'application/json' };
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'; // 华为网关无浏览器 UA 会 403
const SNIPPETS = {
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
      if (b.code === 200) return !!b.data?.id; if (b.code === 500 && b.data == null) return false; throw new Error('code ' + b.code); }
    const b = await (await fetch(`https://${h}/api/campuspc/position/getJobDetails?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 200) return !!b.data; throw new Error('code ' + b.code); },
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
  // vivo（北森 hr-campus.vivo.com）：要用 GUID；不存在 → Code 500 "参数错误"；Data.Status 2 = 已关闭（页面跳 /job/empty）。
  vivo: async pid => { const b = await (await fetch(`https://hr-campus.vivo.com/api/JobAd/GetJobAdInfo?jobAdId=${pid}`, { headers: UA, signal: T() })).json();
    if (b.Code === 200 && b.Data) return b.Data.Status !== 2; if (b.Code === 500) return false; throw new Error('Code ' + b.Code); },
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
if (typeof module !== 'undefined') module.exports = SNIPPETS;
