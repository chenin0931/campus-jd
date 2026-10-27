#!/usr/bin/env node
// 小米校招 xiaomi.jobs.f.mioffice.cn（飞书招聘，接口同字节；参考 reference/xm.py）。全量拉取后本地分类。
const { classifyMore, nowIso, request, cookiesOf, run } = require('../lib/common');
const BASE = 'https://xiaomi.jobs.f.mioffice.cn';
const H = { 'Content-Type': 'application/json', 'portal-channel': 'saas-career', 'website-path': 'campus', Referer: `${BASE}/campus/position` };
run('xiaomi', async () => {
  const r = await request(`${BASE}/api/v1/csrf/token`, { method: 'POST', headers: H, body: { portal_entrance: 1 }, raw: true });
  const cookie = cookiesOf(r).join('; '), token = (await r.json()).data.token;
  const hdr = { ...H, 'x-csrf-token': token, cookie }, now = nowIso(), L = [];
  for (let off = 0; ; off += 100) {
    const d = (await request(`${BASE}/api/v1/search/job/posts`, { method: 'POST', headers: hdr, body: { keyword: '', limit: 100, offset: off, portal_type: 6 } })).data;
    L.push(...(d.job_post_list || [])); if (!d.job_post_list?.length || off + 100 >= (d.count || 0)) break;
  }
  return L.flatMap(j => { const category = classifyMore(j.title); if (!category) return [];
    const url = `${BASE}/campus/position/${j.id}/detail`;
    const city = (j.city_list || []).map(x => x.name); if (!city.length && j.city_info) city.push(j.city_info.name);
    const intern = j.recruit_type?.name === '实习' || j.recruit_type?.parent?.name === '实习' || /实习/.test(j.title);
    return [{ company: '小米', business_unit: [], title: j.title, category, job_type: intern ? '实习' : '校招', city, project: j.job_subject?.name?.zh_cn || j.job_subject?.name || null, requirements: j.requirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }]; });
});
