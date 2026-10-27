#!/usr/bin/env node
// OPPO careers.oppo.com：POST /openapi/position/pageNew 全量（应届生/博士生→校招，实习生→实习）；projectName 回填 project。参考 reference/oppo.py
const { classifyMore, nowIso, request, run } = require('../lib/common');
run('oppo', async () => {
  const d = (await request('https://careers.oppo.com/openapi/position/pageNew', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { pageNum: 1, pageSize: 1000 } })).data;
  if (d.records.length !== d.total) throw new Error(`条数不全 ${d.records.length}/${d.total}`);
  const now = nowIso();
  return d.records.flatMap(x => { const c = classifyMore(x.positionName); if (!c) return []; const url = `https://careers.oppo.com/university/oppo/campus/post/${x.idRecruitPosition}`;
    return [{ company: 'OPPO', title: x.positionName, category: c, city: String(x.workCityName || '').split(/[,，、]/).filter(Boolean), requirements: ((x.positionDesc || '') + '\n' + (x.positionRequire || '')).trim(), deadline: null, apply_url: url, source_url: url, fetched_at: now,
      job_type: x.recruitmentType === 'Intern' || /实习/.test(x.recruitmentTypeName || '') ? '实习' : '校招', project: x.projectName || null }]; });
});
