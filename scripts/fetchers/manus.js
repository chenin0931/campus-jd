#!/usr/bin/env node
// Manus careers.manus.im 自建 tRPC：一次返回全部岗位，无详情接口（SPA 路由 /cn/job/<uuid> 读列表数据），只收 type=实习，link_status 标「链接待核」
// 用法：node scripts/fetchers/manus.js [--out dir]（默认 staging/2026-W44/startups_node）
const path = require('path');
const { classify, nowIso, request, args, writeJobs } = require('../lib/common');
const strip = h => String(h || '').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
(async () => {
  const u = 'https://careers.manus.im/api/trpc/applications.publicJobs?input=' + encodeURIComponent(JSON.stringify({ json: { locale: 'zh' } }));
  const L = (await request(u, { headers: { 'User-Agent': 'Mozilla/5.0' } })).result.data.json, now = nowIso();
  const jobs = L.filter(j => /实习/.test(j.type || '')).flatMap(j => { const cat = classify(j.title); if (!cat) return [];
    const url = `https://careers.manus.im/cn/job/${j.id}`;
    return [{ id: `manus-${j.id}`, company: 'Manus', title: j.title, category: cat, city: (j.locations || []).map(x => typeof x === 'string' ? x : x.name || x.city || '').filter(Boolean),
      requirements: strip(j.descriptionHtml), deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: '实习', link_status: '链接待核' }]; });
  console.log(JSON.stringify({ raw: L.length, intern: L.filter(j => /实习/.test(j.type || '')).length, kept: jobs.length }));
  if (jobs.length) writeJobs('manus', jobs, { out: args().out || path.join(__dirname, '..', '..', 'staging', '2026-W44', 'startups_node'), force: true }); else console.log('manus: 0 条，不写文件');
})().catch(e => { console.error('[manus] 失败:', e.message); process.exit(1); });
