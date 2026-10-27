#!/usr/bin/env node
// 美团校招 zhaopin.meituan.com（参考 reference/more.py）。jobType code 1=校招 2=实习，按 jobUnionId 去重。apply_url 为拼接，未核实。
const { classify, nowIso, request, run } = require('../lib/common');
run('meituan', async () => {
  const now = nowIso(), seen = new Map();
  for (const [code, jt] of [['1', '校招'], ['2', '实习']]) for (let p = 1; ; p++) {
    const d = (await request('https://zhaopin.meituan.com/api/official/job/getJobList', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: {
      page: { pageNo: p, pageSize: 50 }, jobShareType: '1', keywords: '', cityList: [], department: [], jfJgList: [], jobType: [{ code, subCode: [] }], typeCode: [], specialCode: [] } })).data;
    if (!d) break;
    for (const x of d.list || []) { if (seen.has(x.jobUnionId)) continue; const category = classify(x.name); seen.set(x.jobUnionId, null); if (!category) continue;
      const url = `https://zhaopin.meituan.com/web/position/detail?jobUnionId=${x.jobUnionId}&highlightType=campus`;
      seen.set(x.jobUnionId, { company: '美团', business_unit: [], title: x.name, category, job_type: jt, city: (x.cityList || []).map(y => y.name),
        requirements: x.jobRequirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }); }
    if (p >= (d.page?.totalPage || 0)) break;
  }
  return [...seen.values()].filter(Boolean);
});
