#!/usr/bin/env node
// 快手校招 campus.kuaishou.cn（参考 reference/more.py）。recruitProjectCode=schoolr → 校招，其他 → 实习。
// apply_url 为拼接的前端路由，未经官方核实，由 scripts/check_links.js 校验。
const { classify, nowIso, request, run } = require('../lib/common');
run('kuaishou', async () => {
  const now = nowIso(), L = [];
  for (let p = 1; ; p++) {
    const r = (await request('https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/simple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { pageNum: p, pageSize: 100 } })).result;
    L.push(...(r.list || [])); if (!r.list?.length || p * 100 >= r.total) break;
  }
  return L.flatMap(x => { const category = classify(x.name); if (!category) return [];
    const url = `https://campus.kuaishou.cn/#/campus/job-info/${x.id}`;
    return [{ company: '快手', business_unit: [], title: x.name, category, job_type: x.recruitProjectCode === 'schoolr' && !/实习/.test(x.name) ? '校招' : '实习',
      city: (x.workLocationDicts || []).map(d => d.name), requirements: x.positionDemand || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }]; });
});
