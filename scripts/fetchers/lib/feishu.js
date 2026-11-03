#!/usr/bin/env node
// 通用飞书招聘抓取器。配置见 scripts/startups.json 的 feishu 段：{slug, company, domain, websitePath, mode}
//   mode=campus        只收校招/实习 recruit_type（跳过社招）
//   mode=social_intern 社招门户：标题或 recruit_type 含「实习」才收，job_type=实习
//   mode=all           全网旧口径（reference/fsco.py）：recruit_type 含「实习」→实习，父类社招→社招（后处理只留标题含实习的），其余→校招
//   mode=text          recruit_type 为空：先查详情接口，仍无则按标题+详情文本（实习/校招/应届/27届）判断
// 排除与归类都交给 common.classify()（全标题排除 + 岗位段归类，见 CLASSIFIER.md）；不在本文件另写关键词。
// 用法：node scripts/fetchers/lib/feishu.js [--only slug] [--out dir]
const path = require('path');
const { classify, nowIso, request, cookiesOf, args, writeJobs } = require('../../lib/common');
const COH = /校招|校园招聘|应届|毕业生|(20)?2[5-9]届/;

async function session(c) {
  const H = { 'Content-Type': 'application/json', 'portal-channel': 'saas-career', 'website-path': c.websitePath, Referer: `${c.domain}/${c.websitePath}/position/list` };
  const r = await request(`${c.domain}/api/v1/csrf/token`, { method: 'POST', headers: H, body: { portal_entrance: 1 }, raw: true });
  return { ...H, 'x-csrf-token': (await r.json()).data.token, cookie: cookiesOf(r).join('; ') };
}
async function list(c, h) {
  const L = [];
  for (let off = 0; ; off += 100) {
    const d = (await request(`${c.domain}/api/v1/search/job/posts`, { method: 'POST', headers: h, body: { keyword: '', limit: 100, offset: off, portal_type: c.portalType || 6 } })).data;
    L.push(...(d.job_post_list || [])); if (!d.job_post_list?.length || off + 100 >= (d.count || 0)) break;
  }
  return [...new Map(L.map(j => [j.id, j])).values()];
}
async function detail(c, h, id) {
  try { return (await request(`${c.domain}/api/v1/job/posts/${id}?portal_type=${c.portalType || 6}&with_recommend=false`, { headers: h, retries: 2 })).data?.job_post_detail || null; }
  catch { return null; }
}
const rtOf = x => { const rt = x?.recruit_type || {}; return { par: rt.parent?.name || '', nm: rt.name || '' }; };

async function fetchCompany(c) {
  const h = await session(c), L = await list(c, h), now = nowIso(), out = [], stat = { raw: L.length, noType: 0, excluded: 0 };
  for (const j of L) {
    let { par, nm } = rtOf(j), jt = null;
    if (c.mode === 'all') jt = /实习/.test(nm) ? '实习' : (/社招/.test(par) ? '社招' : '校招');
    else if (c.mode === 'social_intern') jt = /实习/.test(nm + par + j.title) ? '实习' : null;
    else if (c.mode === 'text') {
      let d = null;
      if (!par && !nm) { d = await detail(c, h, j.id); ({ par, nm } = rtOf(d)); }
      if (par || nm) jt = /实习/.test(nm + par + j.title) ? '实习' : (/社招/.test(par + nm) ? null : (COH.test(nm + par) || /校/.test(nm + par) ? '校招' : null));
      else { stat.noType++; const t = [j.title, j.description, j.requirement, d?.description, d?.requirement].join(' '); jt = /实习/.test(t) ? '实习' : (COH.test(t) ? '校招' : null); }
    } else {
      if (/社招/.test(par + nm)) continue;
      jt = /实习/.test(nm + par) ? '实习' : (/校|应届|毕业/.test(nm + par) ? '校招' : null);
    }
    if (!jt) continue;
    const cat = classify(j.title); if (!cat) { stat.excluded++; continue; }
    const url = `${c.domain}/${c.websitePath}/position/${j.id}/detail`;
    const city = (j.city_list || []).map(x => x.name); if (!city.length && j.city_info?.name) city.push(j.city_info.name);
    out.push({ id: `${c.slug}-${j.id}`, company: c.company, title: j.title, category: cat, city, requirements: j.requirement || '', deadline: null,
      apply_url: url, source_url: url, fetched_at: now, job_type: jt, project: j.job_subject?.name?.zh_cn || (typeof j.job_subject?.name === 'string' ? j.job_subject.name : null), _pid: j.id });
  }
  // 详情核验：抽 3 条真 id + 1 条假 id，接口能区分才算可信
  const sample = out.slice(0, 3); let ok = null;
  if (sample.length) { const good = await Promise.all(sample.map(x => detail(c, h, x._pid))); const fake = await detail(c, h, '7000000000000000001'); ok = good.every(Boolean) && !fake; }
  for (const r of out) delete r._pid;
  return { jobs: out, stat: { ...stat, kept: out.length, detailCheck: ok } };
}

module.exports = { fetchCompany };
if (require.main === module) (async () => {
  const a = args(), cfg = require('../../startups.json').feishu, dir = a.out || path.join(__dirname, '..', '..', '..', 'staging', '2026-W44', 'startups_node');
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
