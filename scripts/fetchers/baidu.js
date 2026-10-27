#!/usr/bin/env node
// 百度校招 talent.baidu.com（参考 reference/more2.py）。表单 POST，pageSize 上限 10；GRADUATE=校招，INTERN=实习。
// 标题先去掉（J123）编号和「部门-」前缀再分类。apply_url 为拼接，未核实。
const { classify, nowIso, request, run } = require('../lib/common');
const H = { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://talent.baidu.com/jobs/list', Origin: 'https://talent.baidu.com', 'User-Agent': 'Mozilla/5.0' };
const bt = n => String(n).replace(/[（(]J\d+[)）]/g, '').replace(/^[^-]{1,6}-/, '');
run('baidu', async () => {
  const now = nowIso(), out = [];
  for (const [rt, jt] of [['GRADUATE', '校招'], ['INTERN', '实习']]) for (let p = 1; ; p++) {
    const d = (await request('https://talent.baidu.com/httservice/getPostListNew', { method: 'POST', headers: H, body: `recruitType=${rt}&pageSize=10&curPage=${p}&keyWord=` })).data;
    for (const x of d.list || []) { const category = classify(bt(x.name)); if (!category) continue;
      const url = `https://talent.baidu.com/jobs/detail/${rt}/${x.postId}`;
      out.push({ company: '百度', business_unit: [], title: x.name, category, job_type: jt, city: (x.workPlace || '').split(',').filter(Boolean),
        requirements: x.serviceCondition || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }); }
    if (!d.list?.length || p * 10 >= +d.total) break;
  }
  return out;
});
