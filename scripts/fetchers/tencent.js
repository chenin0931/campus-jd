#!/usr/bin/env node
// 腾讯校招官网 join.qq.com（参考 reference/tx.py）：列表 + 逐条详情取 request；projectName 区分校招/实习
const { classify, nowIso, request, run } = require('../lib/common');
const BASE = 'https://join.qq.com';
const H = { 'Content-Type': 'application/json' };
const KEYWORDS = [''];  // 不带关键词，拉全量后本地 classify（排除法）

run('tencent', async () => {
  const now = nowIso(), seen = new Map();
  for (const kw of KEYWORDS) for (let p = 1; ; p++) {
    const d = (await request(`${BASE}/api/v1/position/searchPosition`, { method: 'POST', headers: H, body: {
      projectIdList: [], projectMappingIdList: [], keyword: kw, bgList: [], workCountryType: 0, workCityList: [], recruitCityList: [], positionFidList: [], pageIndex: p, pageSize: 100 } })).data;
    const L = d.positionList || [];
    for (const j of L) {
      if (seen.has(j.postId)) continue;
      const category = classify(j.positionTitle); if (!category) continue; // 含「研究/课题」的已在 classify 排除
      const det = (await request(`${BASE}/api/v1/jobDetails/getJobDetailsByPostId?postId=${j.postId}`, { headers: H })).data || {};
      const url = `${BASE}/post_detail.html?postid=${j.postId}`;
      seen.set(j.postId, { company: '腾讯', project: j.projectName || null, business_unit: (j.bgs || '').split(/[,，\s]+/).filter(Boolean), title: j.positionTitle, category, job_type: /实习/.test(j.projectName || '') ? '实习' : '校招',
        city: (j.workCities || '').split(/\s+/).filter(Boolean), requirements: det.request || '', deadline: null, apply_url: url, source_url: url, fetched_at: now });
    }
    if (!L.length || p * 100 >= (d.count || 0)) break;
  }
  return [...seen.values()];
});
