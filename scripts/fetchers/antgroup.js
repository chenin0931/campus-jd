#!/usr/bin/env node
// 蚂蚁集团校招站 talent.antgroup.com（参考 reference/ant.py）。接口 hrcareersweb.antgroup.com，pageSize 最大 20。
// 拉全量（约 400 条）后本地分类；batchType=intern 或批次/标题含“实习”→实习。
// 用法：node scripts/fetchers/antgroup.js [--out 目录] [--week 2026-W44] [--force]
const { classify, nowIso, request, run } = require('../lib/common');
const API = 'https://hrcareersweb.antgroup.com/api/campus/position/search';
const H = { 'Content-Type': 'application/json', Origin: 'https://talent.antgroup.com', Referer: 'https://talent.antgroup.com/campus-list' };
const PAGE = 20;

// 标题常见形如「蚂蚁集团-医学专项-AI 健康产品评测专家」或「【Plan A】xxx-蚂蚁健康-27届」：去掉前缀后再分类
function parse(name) {
  let t = String(name).replace(/^【[^】]*】/, '').trim();
  const seg = t.split(/\s*[-－—]\s*/).filter(Boolean);
  if (/^蚂蚁集团$/.test(seg[0])) seg.shift();
  // 「蚂蚁集团-业务-岗位」→ 岗位在最后；否则岗位在最前
  const head = seg.length >= 2 && /^蚂蚁集团/.test(String(name).replace(/^【[^】]*】/, '')) ? seg.at(-1) : seg[0];
  const bu = seg.filter(x => x !== head && !/^\d{2}届$/.test(x));
  return { head: head || t, bu };
}

run('antgroup', async () => {
  const now = nowIso(), seen = new Map();
  for (let p = 1; ; p++) {
    const r = await request(API, { method: 'POST', headers: H, body: { pageIndex: p, pageSize: PAGE, channel: 'campus_group_official_site', language: 'zh' } });
    if (!r.success) throw new Error(`返回异常: ${JSON.stringify(r).slice(0, 200)}`);
    const L = r.content || [];
    for (const j of L) {
      const id = String(j.id); if (seen.has(id)) continue;
      const { head, bu } = parse(j.name);
      if (!classify(j.name)) continue;  // 排除按全标题（CLASSIFIER §2）
      const category = classify(j.name) || classify(head);
      const url = `https://talent.antgroup.com/campus-position?positionId=${id}&locale=zh-CN`;
      const intern = j.batchType === 'intern' || j.batchType === 'internship' || /实习/.test(j.batchName || '') || /实习/.test(j.name);
      seen.set(id, { company: '蚂蚁集团', business_unit: bu, title: j.name, category, job_type: intern ? '实习' : '校招', city: j.workLocations || [],
        requirements: j.requirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now });
    }
    if (L.length < PAGE || p * PAGE >= (r.totalCount || 0)) break;
  }
  return [...seen.values()];
});
