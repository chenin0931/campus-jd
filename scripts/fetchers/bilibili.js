#!/usr/bin/env node
// 哔哩哔哩 jobs.bilibili.com：先取 csrf（前端固定头 X-AppKey/X-UserType），再一次拉全量。参考 reference/bilibili.py
// B站请求过密会断连：本抓取器串行、请求间隔 ≥1.5s（RATE_MS 可覆盖）。
const { classify, nowIso, request, run } = require('../lib/common');
const B = 'https://jobs.bilibili.com', UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const H = { 'User-Agent': UA, 'X-AppKey': 'ops.ehr-api.auth', 'X-UserType': '2', Origin: B, Referer: `${B}/campus/positions` }, rateMs = +process.env.RATE_MS || 1500;
run('bilibili', async () => {
  const t = (await request(`${B}/api/auth/v1/csrf/token`, { headers: H, rateMs })).data;
  const d = await request(`${B}/api/campus/position/positionList`, { method: 'POST', headers: { ...H, 'X-CSRF': t, 'Content-Type': 'application/json' }, body: { pageSize: 2000, pageNum: 1 }, rateMs });
  if (d.code !== 0) throw new Error('code ' + d.code);
  const L = d.data.list; if (L.length !== d.data.total) throw new Error(`条数不全 ${L.length}/${d.data.total}`);
  const now = nowIso();
  return L.flatMap(x => { const c = classify(x.positionName); if (!c) return []; const url = `${B}/campus/positions/${x.id}`;
    return [{ company: '哔哩哔哩', title: x.positionName, category: c, city: String(x.workLocation || '').split(/[/,，、]/).filter(Boolean), requirements: String(x.positionDescription || '').replace(/<[^>]+>/g, '').trim(), deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: x.positionTypeName === '实习' ? '实习' : '校招' }]; });
});
