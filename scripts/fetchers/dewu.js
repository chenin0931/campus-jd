#!/usr/bin/env node
// 得物 campus.dewu.com（飞书招聘 SaaS，website-path 578078，与小米/字节的 'campus' 不同）。参考 reference/fsco.py；批次名回填 project
const { classify, nowIso, request, cookiesOf, run } = require('../lib/common');
const BASE = 'https://campus.dewu.com', WP = '578078';
const H = { 'Content-Type': 'application/json', 'portal-channel': 'saas-career', 'website-path': WP, Referer: `${BASE}/${WP}/position/list` };
run('dewu', async () => {
  const r = await request(`${BASE}/api/v1/csrf/token`, { method: 'POST', headers: H, body: { portal_entrance: 1 }, raw: true });
  const cookie = cookiesOf(r).join('; '), token = (await r.json()).data.token, hdr = { ...H, 'x-csrf-token': token, cookie }, L = [];
  for (let off = 0; ; off += 100) {
    const d = (await request(`${BASE}/api/v1/search/job/posts`, { method: 'POST', headers: hdr, body: { keyword: '', limit: 100, offset: off, portal_type: 6 } })).data;
    L.push(...(d.job_post_list || [])); if (!d.job_post_list?.length || off + 100 >= (d.count || 0)) break;
  }
  const now = nowIso();
  return L.flatMap(j => { const c = classify(j.title); if (!c) return []; const rt = j.recruit_type || {};
    if (rt.parent?.name === '社招') return [];
    const url = `${BASE}/${WP}/position/${j.id}/detail`;
    const city = (j.city_list || []).map(x => x.name); if (!city.length && j.city_info) city.push(j.city_info.name);
    return [{ company: '得物', title: j.title, category: c, city, requirements: j.requirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: /实习/.test(rt.name || '') ? '实习' : '校招', project: j.job_subject?.name?.zh_cn || j.job_subject?.name || null }]; });
});
