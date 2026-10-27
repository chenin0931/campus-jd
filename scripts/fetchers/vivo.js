#!/usr/bin/env node
// vivo hr-campus.vivo.com（北森）：POST /api/Jobad/GetJobAdPageList（校园招聘→校招，实习生招聘→实习）。参考 reference/vivo.py
const { classifyMore, nowIso, request, run } = require('../lib/common');
const P = '903cbcbf-4898-46e1-817c-da522a9752b1';
run('vivo', async () => {
  const d = await request('https://hr-campus.vivo.com/api/Jobad/GetJobAdPageList', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { PageIndex: 0, PageSize: 1000, KeyWords: '', SpecialType: 0, PortalId: P, DisplayFields: ['Category', 'Kind', 'LocId', 'ClassificationOne'] } });
  const R = d.Data || []; if (R.length !== d.Count) throw new Error(`条数不全 ${R.length}/${d.Count}`);
  const now = nowIso();
  return R.flatMap(x => { const c = classifyMore(x.JobAdName); if (!c) return []; const intern = /实习/.test(x.Category || '');
    const url = `https://hr-campus.vivo.com/${intern ? 'intern' : 'campus'}/detail?jobAdId=${x.Id}`;
    return [{ company: 'vivo', title: x.JobAdName, category: c, city: (x.LocNames || []).map(l => l.split('·').at(-1)), requirements: '岗位职责：\n' + (x.Duty || '') + '\n任职要求：\n' + (x.Require || ''), deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: intern ? '实习' : '校招' }]; });
});
