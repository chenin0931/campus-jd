#!/usr/bin/env node
// 字节跳动校招官网 jobs.bytedance.com（参考 reference/bd.py）
// 用法：node scripts/fetchers/bytedance.js [--out 目录] [--week 2026-W44] [--force]
const { classify, nowIso, request, cookiesOf, run } = require('../lib/common');
const BASE = 'https://jobs.bytedance.com';
const H = { 'Content-Type': 'application/json', 'portal-channel': 'campus', 'website-path': 'campus', Referer: `${BASE}/campus/position` };
const KEYWORDS = [''];  // 不带关键词，拉全量后本地 classify（排除法）

run('bytedance', async () => {
  const r = await request(`${BASE}/api/v1/csrf/token`, { method: 'POST', headers: H, body: { portal_entrance: 1 }, raw: true });
  const cookie = cookiesOf(r).join('; '), token = (await r.json()).data.token;
  const hdr = { ...H, 'x-csrf-token': token, cookie }, now = nowIso(), seen = new Map();
  for (const kw of KEYWORDS) for (let off = 0; ; off += 100) {
    const d = (await request(`${BASE}/api/v1/search/job/posts`, { method: 'POST', headers: hdr, body: { keyword: kw, limit: 100, offset: off, portal_type: 3 } })).data;
    const L = d.job_post_list || [];
    for (const j of L) {
      if (seen.has(j.id)) continue;
      const category = classify(j.title); if (!category) continue;
      const url = `${BASE}/campus/position/${j.id}/detail`;
      const city = (j.city_list || []).map(x => x.name); if (!city.length && j.city_info) city.push(j.city_info.name);
      const intern = j.recruit_type?.name === '实习' || j.recruit_type?.parent?.name === '实习' || /实习/.test(j.title);
      const bu = String(j.title).split(/\s+[-－—]\s+/).slice(1).filter(Boolean);
      seen.set(j.id, { company: '字节跳动', business_unit: bu, title: j.title, category, job_type: intern ? '实习' : '校招', city, project: j.job_subject?.name?.zh_cn || j.job_subject?.name || null, requirements: j.requirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now });
    }
    if (!L.length || off + 100 >= (d.count || 0)) break;
  }
  return [...seen.values()];
});
