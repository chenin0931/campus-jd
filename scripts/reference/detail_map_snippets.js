// Drop-in DETAIL entries for scripts/check_links.js (paste inside `const DETAIL = {...}`; relies on UA + AbortSignal there).
// Each: async (pid, url) => true (在招) | false (不存在/下架) | throw (接口异常 → 回退)。All verified 2026-10-27 with real + fake ids.
const T = () => AbortSignal.timeout(15e3), J = { ...UA, 'Content-Type': 'application/json' };
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
  netease: async pid => { const host = 'campus.163.com';
    const b = await (await fetch(`https://${host}/api/campuspc/position/getJobDetails?id=${pid}`, { headers: UA, signal: T() })).json();
    if (b.code === 200) return !!b.data; throw new Error('code ' + b.code); },
};
if (typeof module !== 'undefined') module.exports = SNIPPETS;
