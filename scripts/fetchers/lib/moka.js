#!/usr/bin/env node
// 通用 Moka 抓取器。配置见 scripts/startups.json 的 moka 段：{slug, company, orgId, siteId, host?, site?, mode?}
// 列表接口返回体 AES-CBC 加密，key = iv = 响应里的 necromancer 字段（与 fetchers/didi.js 相同解法）。
// job_type：项目/招聘类型/标题含「实习」→实习；含校招/应届/届 → 校招；mode=social_intern 时只收实习；其余（社招）不收。
// 用法：node scripts/fetchers/lib/moka.js [--only slug] [--out dir]
const crypto = require('crypto'), path = require('path');
const { classify, nowIso, request, args, writeJobs } = require('../../lib/common');
const UA = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' };
function decrypt(d) {
  if (!d.necromancer) return d.data;
  const k = Buffer.from(d.necromancer), dc = crypto.createDecipheriv(`aes-${k.length * 8}-cbc`, k, k);
  dc.setAutoPadding(false);
  let p = Buffer.concat([dc.update(Buffer.from(d.data, 'base64')), dc.final()]); p = p.subarray(0, p.length - p[p.length - 1]);
  const s = p.toString('utf8'); return JSON.parse('{' + s.slice(s.indexOf('"data":'))).data;
}
async function list(c) {
  const host = c.host || 'https://app.mokahr.com', L = [];
  for (const site of [c.site || 'campus']) {
    try {
      for (let off = 0; ; off += 50) {
        const d = decrypt(await request(`${host}/api/outer/ats-apply/website/jobs/v2`, { method: 'POST', headers: UA, retries: 3,
          body: { limit: 50, offset: off, siteId: c.siteId, orgId: c.orgId, site, needStat: true } }));
        L.push(...(d.jobs || [])); if (!d.jobs?.length || off + 50 >= (d.jobStats?.total || 0)) break;
      }
      if (L.length) return { L: [...new Map(L.map(j => [j.id, j])).values()], site };
    } catch (e) { console.error(`  ${c.slug} site=${site}: ${e.message}`); }
  }
  return { L, site: null };
}
// hireMode: 2=校园招聘站（commitment 区分 全职/实习），1=社招站（只在标题/性质写明「实习」时收为实习）
function jobType(x) {
  const t = [x.projectFolder?.name, x.commitment, x.title].filter(Boolean).join(' ');
  if (/实习/.test(x.commitment || '') || /实习/.test(x.title) && !/全职/.test(x.title)) return '实习';
  if (x.hireMode === 2) return '校招';
  return /校招|应届|(20)?2[6-9]\s?届/.test(t) ? '校招' : null;
}
// Moka locations 给的是区县（cityName=海淀区），按行政区划代码前 4 位映射到地级市；直辖市用 provinceName
const PREF = { '4403': '深圳', '4401': '广州', '4404': '珠海', '4406': '佛山', '4419': '东莞', '3301': '杭州', '3302': '宁波', '3201': '南京', '3205': '苏州', '3202': '无锡', '3401': '合肥',
  '4201': '武汉', '4301': '长沙', '5101': '成都', '6101': '西安', '3501': '福州', '3502': '厦门', '3701': '济南', '3702': '青岛', '4101': '郑州', '2101': '沈阳', '2102': '大连', '1509': '乌兰察布', '1301': '石家庄', '4602': '三亚', '4601': '海口' };
const TITLE_CITY = /北京|上海|深圳|广州|杭州|成都|武汉|南京|苏州|西安|合肥|长沙|重庆|天津|新加坡|香港/g;
const DIRECT = /^(北京|上海|天津|重庆)/;
function cityOf(l) {
  if (DIRECT.test(l.provinceName || '')) return l.provinceName.replace(/市$/, '');
  const pre = String(l.cityId || '').slice(0, 4); if (PREF[pre]) return PREF[pre];
  return (l.cityName || l.address || '').replace(/市$/, '');
}
async function fetchCompany(c) {
  const host = c.host || 'https://app.mokahr.com', { L, site } = await list(c), now = nowIso(), out = [], stat = { raw: L.length, site, excluded: 0 };
  const pageKind = c.pathKind || (L.some(x => x.hireMode === 2) ? 'campus-recruitment' : 'social-recruitment');
  for (const x of L) {
    let jt = jobType(x);
    if (c.mode === 'social_intern' && jt !== '实习') jt = null;
    if (!jt) continue;
    const cat = classify(x.title.replace(/^\d+届(秋招|春招|实习|暑期实习|校招)?\s*[-－]\s*/, '')); if (!cat) { stat.excluded++; continue; }
    let city = [...new Set((x.locations || []).map(cityOf).filter(Boolean))];
    if (!city.length) city = [...new Set(x.title.match(TITLE_CITY) || [])];   // locations 为空时（Shopee/星尘），从标题「-深圳」取城市
    const url = `${host}/${pageKind}/${c.orgId}/${c.siteId}#/job/${x.id}`;
    out.push({ id: `${c.slug}-${x.id}`, company: c.company, title: x.title, category: cat, city,
      requirements: x.jobDescription || '', deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type: jt, ...(c.sourceNote ? { source_note: c.sourceNote } : {}), project: x.projectFolder?.name || null });
  }
  return { jobs: out, stat: { ...stat, kept: out.length } };
}
module.exports = { fetchCompany, decrypt };
if (require.main === module) (async () => {
  const a = args(), cfg = require('../../startups.json').moka, dir = a.out || path.join(__dirname, '..', '..', '..', 'staging', '2026-W44', 'startups_node');
  // 同一 slug 可配多条（如校招站 + 社招站挑实习），合并后按 id 去重再写出
  const groups = {}; for (const c of cfg.filter(c => !a.only || a.only.split(',').includes(c.slug))) (groups[c.slug] ||= []).push(c);
  for (const [slug, cs] of Object.entries(groups)) {
    const all = new Map();
    for (const c of cs) {
      try { const { jobs, stat } = await fetchCompany(c); console.log(JSON.stringify({ slug, src: c.websitePath || c.siteId, ...stat })); for (const j of jobs) if (!all.has(j.id)) all.set(j.id, j); }
      catch (e) { console.error(`[${slug} ${c.websitePath || c.siteId}] 失败: ${e.message}`); }
    }
    if (all.size) writeJobs(slug, [...all.values()], { out: dir, force: true }); else console.log(`${slug}: 0 条，不写文件`);
  }
})();
