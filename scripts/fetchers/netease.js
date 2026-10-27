#!/usr/bin/env node
// 网易：campus.163.com（网易互联网校招）、campus.game.163.com（网易互娱校招/实习）、hr.163.com（日常实习）。参考 reference/ne.py
const { classify, nowIso, request, run } = require('../lib/common');
const P = [[103, 'campus.163.com', '校招', '网易互联网'], [102, 'campus.game.163.com', '校招', '网易互娱'], [75, 'campus.game.163.com', '实习', '网易互娱'], [104, 'campus.game.163.com', '校招', '网易互娱']];
run('netease', async () => {
  const now = nowIso(), out = [];
  const rec = (title, category, city, req, url, job_type, bu) => ({ company: '网易', title, category, city, requirements: req || '', deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type, business_unit: [bu] });
  for (const [pid, h, jt, bu] of P) for (let p = 1; ; p++) {
    const d = (await request(`https://${h}/api/campuspc/position/getJobList?projectId=${pid}&currentPage=${p}&pageSize=50`)).data;
    for (const x of d.list || []) { const c = classify(x.positionName); if (!c) continue;
      out.push(rec(x.positionName, c, String(x.workPlaceName || '').split(',').filter(Boolean), x.positionRequirement, `https://${h}/app/detail/index?id=${x.id}&projectId=${pid}`, jt, bu)); }
    if (d.lastPage || p >= d.pages) break;
  }
  for (let p = 1; ; p++) {   // 日常实习
    const d = (await request('https://hr.163.com/api/hr163/position/queryPage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { currentPage: p, pageSize: 100, workType: '1' } })).data;
    for (const x of d.list || []) { const c = classify(x.name); if (!c) continue;
      out.push(rec(x.name, c, x.workPlaceNameList || [], x.requirement, `https://hr.163.com/job-detail.html?id=${x.id}`, '实习', x.productName || x.firstDepName || '网易')); }
    if (p >= d.pages) break;
  }
  return out;
});
