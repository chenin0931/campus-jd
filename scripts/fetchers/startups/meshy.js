#!/usr/bin/env node
// Meshy：Ashby 公开 posting API。只收 employmentType=Intern 的岗位（国内外都收，海外由 writeJobs 标 region=海外，§11）；标题保留英文原样；0 条不写文件
const path = require('path');
const { classify, nowIso, request, args, writeJobs } = require('../../lib/common');
const CN = /China|中国|Beijing|Shanghai|Shenzhen|Hangzhou|Guangzhou|Chengdu|北京|上海|深圳|杭州|广州|成都/i, NOT = /Hong Kong|Taiwan|Macau|香港|台湾|澳门/i;
(async () => {
  const d = await request('https://api.ashbyhq.com/posting-api/job-board/meshy?includeCompensation=false', { headers: { 'User-Agent': 'Mozilla/5.0' } }), now = nowIso();
  const locs = j => [j.location, ...(j.secondaryLocations || []).map(x => x.location), j.address?.postalAddress?.addressCountry, j.address?.postalAddress?.addressLocality].filter(Boolean);
  const intern = d.jobs.filter(j => j.employmentType === 'Intern'), cn = intern;
  const jobs = cn.flatMap(j => { const cat = classify(j.title); if (!cat) return [];
    return [{ id: `meshy-${j.id}`, company: 'Meshy', title: j.title, category: cat, city: [...new Set(locs(j).filter(l => !/^(China|中国|[A-Z]{2,3})$/.test(l)).map(l => l.split(',')[0].trim()))],
      requirements: j.descriptionPlain || '', deadline: null, apply_url: j.applyUrl || j.jobUrl, source_url: j.jobUrl, fetched_at: now, job_type: '实习' }]; });
  console.log(JSON.stringify({ raw: d.jobs.length, intern: intern.length, internCN: cn.length, kept: jobs.length, internTitles: intern.map(j => `${j.title} @ ${j.location}`) }));
  if (jobs.length) writeJobs('meshy', jobs, { out: args().out || path.join(__dirname, '..', '..', '..', 'staging', '2026-W44', 'startups_node'), force: true }); else console.log('meshy: 0 条，不写文件');
})().catch(e => { console.error('[meshy] 失败:', e.message); process.exit(1); });
