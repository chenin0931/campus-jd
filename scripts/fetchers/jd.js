#!/usr/bin/env node
// 京东校招+实习（type=present/internship） campus.jd.com（参考 reference/more2.py）。接口 pageSize 上限 10。apply_url 为前端 hash 路由，未核实。
const { classify, nowIso, request, run } = require('../lib/common');
const city = x => [...new Set((x.requirementVoList || []).flatMap(r => { const v = r.workCity;
  return typeof v === 'string' ? v.split(/[,，、]/) : Array.isArray(v) ? v.map(c => typeof c === 'string' ? c : c.name || '') : []; }).filter(Boolean))].sort();
run('jd', async () => {
  const now = nowIso(), L = [];
  for (const type of ['present', 'internship']) for (let p = 1; ; p++) {
    const b = (await request(`https://campus.jd.com/api/wx/position/page?type=${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: { pageSize: 10, pageIndex: p, parameter: { positionName: '', planIdList: [], jobDirectionCodeList: [], workCityCodeList: [], positionDeptList: [] } } })).body;
    L.push(...(b.items || []).map(x => ({ ...x, _intern: type === 'internship' }))); if (!b.items?.length || p * 10 >= b.totalNumber) break;
  }
  return L.flatMap(x => { const category = classify(x.positionName); if (!category) return [];
    const url = `https://campus.jd.com/#/details?id=${x.publishId}`;
    return [{ company: '京东', business_unit: [], title: x.positionName, category, job_type: x._intern || /实习/.test(x.positionName) ? '实习' : '校招', city: city(x),
      requirements: x.qualification || '', deadline: null, apply_url: url, source_url: url, fetched_at: now }]; });
});
