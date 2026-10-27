#!/usr/bin/env node
// 小红书校招 job.xiaohongshu.com（参考 reference/more.py）。apply_url 为拼接，未核实。
const { classifyMore, nowIso, request, run } = require('../lib/common');
run('xiaohongshu', async () => {
  const now = nowIso(), L = [];
  for (let p = 1; ; p++) {
    const d = (await request('https://job.xiaohongshu.com/websiterecruit/position/pageQueryPosition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { recruitType: 'campus', pageNum: p, pageSize: 100 } })).data;
    L.push(...(d.list || [])); if (!d.list?.length || p >= d.totalPage) break;
  }
  return L.flatMap(x => { const category = classifyMore(x.positionName); if (!category) return [];
    const url = `https://job.xiaohongshu.com/campus/position/${x.positionId}`;
    return [{ company: '小红书', business_unit: [], title: x.positionName, category, job_type: /实习/.test(x.positionName + (x.jobProjectName || '')) ? '实习' : '校招',
      city: (x.workplace || '').split(/[，,]/).filter(Boolean), requirements: x.qualification || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }]; });
});
