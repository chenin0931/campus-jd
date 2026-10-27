#!/usr/bin/env node
// 米哈游 ats.openout.mihoyo.com/ats-portal：列表 + 逐条详情取职责/要求；project = 项目名 · 招聘对象。参考 reference/mhy.py
const { classifyMore, nowIso, request, run } = require('../lib/common');
const B = 'https://ats.openout.mihoyo.com/ats-portal', H = { 'Content-Type': 'application/json' };
run('mihoyo', async () => {
  const L = [];
  for (let p = 1; ; p++) { const d = (await request(`${B}/v1/job/list`, { method: 'POST', headers: H, body: { pageNo: p, pageSize: 100, channelDetailIds: [1], hireType: 1 } })).data;
    L.push(...d.list); if (p * 100 >= +d.total) break; }
  const now = nowIso(), out = [];
  for (const j of L) { const c = classifyMore(j.title); if (!c) continue;
    const det = (await request(`${B}/v1/job/info`, { method: 'POST', headers: H, body: { id: j.id, channelDetailIds: [1], hireType: 1 } })).data || {};
    const url = `https://jobs.mihoyo.com/#/campus/position/${j.id}`;
    out.push({ company: '米哈游', title: j.title, category: c, city: (j.addressDetailList || []).map(a => a.addressDetail), requirements: '岗位职责：\n' + (det.description || '') + '\n任职要求：\n' + (det.jobRequire || ''), deadline: null, apply_url: url, source_url: url, fetched_at: now,
      job_type: j.jobNature === '实习' ? '实习' : '校招', project: [j.projectName, j.objectName].filter(Boolean).join(' · ') || null }); }
  return out;
});
