#!/usr/bin/env node
// 华为 career.huawei.com 新站（apigw getJobPage，jobType=CR）：FRESH_GRADUATE→校招，INTERN→实习。网关必须带浏览器 UA，否则 403。参考 reference/huawei.py
const { classifyMore, nowIso, request, run } = require('../lib/common');
const A = 'https://apigw-dgg-b0.huawei.com/api/apig/channelhw/recruitmentPosition/pub/getJobPage?X-HW-ID=app_000000035886';
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const H = { 'User-Agent': BROWSER_UA, 'Content-Type': 'application/json', Origin: 'https://career.huawei.com', Referer: 'https://career.huawei.com/cn/campus-recruitment-job-list', 'x-language': 'zh_CN', 'x-jalor-tenantAlias': 'hcm', 'X-HW-ID': 'app_000000035886', 'x-Referer': 'https://career.huawei.com/cn' };
async function all(rt) { const R = [];
  for (let p = 1; ; p++) { const d = await request(A, { method: 'POST', headers: H, body: { curPage: p, pageSize: 100, jobType: 'CR', recruitmentType: [rt] } });
    if (d.status !== 'SUCCESS') throw new Error('huawei ' + JSON.stringify(d.errors)); R.push(...d.data.result);
    if (R.length >= d.data.pageVO.totalRows || !d.data.result.length) return R; } }
run('huawei', async () => {
  const now = nowIso(), out = [];
  for (const [rt, jt] of [['FRESH_GRADUATE', '校招'], ['INTERN', '实习']]) for (const x of await all(rt)) { const c = classifyMore(x.jobName); if (!c) continue;
    const url = `https://career.huawei.com/cn/job-details?advertisementId=${x.advertisementId}`;
    out.push({ company: '华为', title: x.jobName, category: c, city: String(x.workPlace || '').split(/[,，/、]/).filter(Boolean), requirements: ((x.mainBusiness || '') + '\n' + (x.jobRequire || '')).trim(), deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: jt }); }
  return out;
});
