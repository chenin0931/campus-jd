#!/usr/bin/env node
// 滴滴：campus.didiglobal.com（Moka，校招 siteId 96064）+ app.mokahr.com（实习 siteId 6222，标题含「实习」）。参考 reference/dd.py
// 列表接口返回体 AES-CBC 加密，key = iv = 响应里的 necromancer 字段（站点前端同样这样解密），用 Node 内置 crypto 解。
const crypto = require('crypto');
const { classify, nowIso, request, run } = require('../lib/common');
const H = 'https://campus.didiglobal.com', M = 'https://app.mokahr.com';
function decrypt(d) {
  const k = Buffer.from(d.necromancer), dc = crypto.createDecipheriv(`aes-${k.length * 8}-cbc`, k, k);
  dc.setAutoPadding(false);
  let p = Buffer.concat([dc.update(Buffer.from(d.data, 'base64')), dc.final()]); p = p.subarray(0, p.length - p[p.length - 1]);
  const s = p.toString('utf8'); return JSON.parse('{' + s.slice(s.indexOf('"data":'))).data;
}
async function all(host, siteId) {
  const L = [];
  for (let off = 0; ; off += 50) {
    const d = decrypt(await request(`${host}/api/outer/ats-apply/website/jobs/v2`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: { limit: 50, offset: off, siteId, orgId: 'didiglobal', site: 'campus', needStat: true } }));
    L.push(...d.jobs); if (off + 50 >= d.jobStats.total) break;
  }
  return L;
}
run('didi', async () => {
  const now = nowIso(), out = [];
  const rec = (x, c, url, jt) => ({ company: '滴滴', title: x.title, category: c, city: (x.locations || []).map(l => l.cityName || l.address || ''), requirements: x.jobDescription || '', deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: jt });
  for (const x of await all(H, 96064)) { const c = classify(x.title.replace(/^\d+届(秋招|春招|实习|暑期实习)?-/, '')); if (!c) continue;
    out.push(rec(x, c, `${H}/campus_apply/didiglobal/96064#/job/${x.id}`, /实习/.test((x.projectFolder?.name || '') + x.title) ? '实习' : '校招')); }
  for (const x of await all(M, 6222)) { if (!x.title.includes('实习')) continue; const c = classify(x.title.replace(/^[^-（(]*?(事业群|BG|Fintech)[^-]*-/, '')); if (!c) continue;
    out.push(rec(x, c, `${M}/apply/didiglobal/6222#/job/${x.id}`, '实习')); }
  return out;
});
