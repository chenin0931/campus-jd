#!/usr/bin/env node
// 阿里系招聘站（参考 reference/ali.py）。每个站一个 site 配置，共用分类；后续子公司站往 SITES 里加。
// 用法：node scripts/fetchers/alibaba.js [--site campus] [--out 目录]
const { classify, nowIso, request, cookiesOf, args, run } = require('../lib/common');

const SITES = {
  // 阿里巴巴集团校招站
  campus: { slug: 'alibaba', company: '阿里巴巴', base: 'https://campus-talent.alibaba.com', entry: '/campus/position', detail: id => `/campus/position/${id}` },
  // 例：taotian: { slug: 'taotian', company: '淘天集团', base: 'https://talent.taotian.com', entry: '...', detail: id => `...` },
};
const KEYWORDS = ['产品', '运营', 'AI', '策划'];

function fetcherFor(s) {
  return async () => {
    // 先访问页面拿 SESSION + XSRF-TOKEN
    const r = await request(s.base + s.entry, { raw: true });
    const ck = cookiesOf(r), xsrf = ck.find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    if (!xsrf) throw new Error('未拿到 XSRF-TOKEN');
    const hdr = { 'Content-Type': 'application/json', 'x-xsrf-token': xsrf, cookie: ck.join('; '), Referer: s.base + s.entry };
    const now = nowIso(), seen = new Map();
    for (const ct of [null, 'internship']) for (const kw of KEYWORDS) for (let p = 1; ; p++) {
      // ct=internship：实习入口（同站 categoryType 过滤；无实习批次开放时返回空，属正常）
      const res = await request(`${s.base}/position/search?_csrf=${xsrf}`, { method: 'POST', headers: hdr, body: { language: 'zh', key: kw, pageIndex: p, pageSize: 100, ...(ct ? { categoryType: ct } : {}) } }); // body 不带 channel
      const c = res.content; if (!c && ct) break; if (!c) throw new Error(`返回异常: ${JSON.stringify(res).slice(0, 200)}`);
      const L = c.datas || [];
      for (const j of L) {
        if (seen.has(j.id)) continue;
        const category = classify(j.name); if (!category) continue;
        const url = s.base + s.detail(j.id);
        const intern = j.categoryType === 'internship' || /实习/.test(j.batchName || '') || /实习/.test(j.name);
        seen.set(j.id, { company: s.company, business_unit: j.circleNames || [], title: j.name, category, job_type: intern ? '实习' : '校招', city: j.workLocations || [],
          requirements: j.requirement || '', deadline: null, apply_url: url, source_url: url, fetched_at: now });
      }
      if (!L.length || p * 100 >= (c.totalCount || 0)) break;
    }
    return [...seen.values()];
  };
}

const site = args().site || 'campus', s = SITES[site];
if (!s) { console.error(`未知站点 ${site}，可选：${Object.keys(SITES).join(',')}`); process.exit(1); }
run(s.slug, fetcherFor(s));
