#!/usr/bin/env node
// 携程 careers.ctrip.com：category=2 校招；category=1（社招列表）中 kindName/标题含「实习」→ 实习。id 保留 MJ 前缀。参考 reference/ctrip.py
// 接口 cityName 可能是英文（Shanghai），按 CITY_EN 转中文；标题去掉末尾 (MJxxxxxx)。
const { classify, nowIso, request, run } = require('../lib/common');
const U = 'https://careers.ctrip.com/api/hrrecruit/getJobAd';
const CITY_EN = { Shanghai: '上海', Beijing: '北京', Guangzhou: '广州', Shenzhen: '深圳', Chengdu: '成都', Hangzhou: '杭州', Nantong: '南通', Guilin: '桂林', Zhengzhou: '郑州', Qingdao: '青岛', Wuhan: '武汉', Nanjing: '南京', Xian: '西安', "Xi'an": '西安', Hefei: '合肥', Shenyang: '沈阳', Harbin: '哈尔滨', Suzhou: '苏州', Xiamen: '厦门', Chongqing: '重庆', Tianjin: '天津', Kunming: '昆明', Sanya: '三亚', Changsha: '长沙', Dalian: '大连', Jinan: '济南', 'Hong Kong': '香港', Singapore: '新加坡' };
const strip = h => String(h || '').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');
async function all(category) { const L = [];
  for (let p = 1; ; p++) { const d = (await request(U, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { condition: { fromId: [], keyword: '', kind: [], country: [], city: [], bucode: [], jobFamilyCode: [], category, jobFamilyGroupCode: [] }, pager: { index: String(p), size: '100' } } })).retValue;
    L.push(...d.recruitJobAdList); if (p * 100 >= d.total) break; }
  return L; }
run('ctrip', async () => {
  const C = await all(2), S = await all(1), now = nowIso(), out = [];
  for (const [jt, L] of [['校招', C], ['实习', S.filter(x => /实习/.test((x.kindName || '') + x.jobTitle))]]) for (const j of L) {
    const t = j.jobTitle.replace(/\(MJ\d+\)$/, '').trim(), c = classify(t); if (!c) continue;
    const url = `https://careers.ctrip.com/#/${jt === '校招' ? 'campus' : 'experienced'}/job-detail/${j.fromId}`;
    out.push({ company: '携程', title: t, category: c, city: j.cityName ? [CITY_EN[j.cityName] || j.cityName] : [], requirements: '岗位职责：\n' + strip(j.duty) + '\n任职要求：\n' + strip(j.requirements), deadline: null, apply_url: url, source_url: url, fetched_at: now,
      job_type: jt === '校招' && t.includes('实习') ? '实习' : jt });
  }
  return out;
});
