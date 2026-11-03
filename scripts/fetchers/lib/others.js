// 全网/初创里非飞书、非 Moka 的官网抓取（JS 移植自 scripts/reference/{bs,trio,lenovo}.py + fetchers/startups/manus.js + fetchers/jd.js）。
// 每个函数返回 { jobs, stat }：jobs 为原始记录（未分类，category='待分类'；需单独请求详情的带 _detail(job)→requirements，标题过了 classify 才调用，省请求），分类/排除/社招/去重统一在 fetch_datasets.js 做。
const { nowIso, request } = require('../../lib/common');
const UA = { 'User-Agent': 'Mozilla/5.0' }, JSONH = { ...UA, 'Content-Type': 'application/json' };
const strip = h => String(h || '').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const rec = (company, title, city, requirements, url, job_type, now) => ({ company, title, category: '待分类', city, requirements: requirements || '', deadline: null, apply_url: url, source_url: url, fetched_at: now, job_type });

// 北森 zhiye（360 / 科大讯飞 / 贝壳）：POST /api/Jobad/GetJobAdPageList，PortalId 在官网 HTML 的 BSGlobal 里
async function zhiye(c) {
  const now = nowIso(), L = [];
  for (let pi = 0; ; pi++) {
    const d = await request(`https://${c.host}/api/Jobad/GetJobAdPageList`, { method: 'POST', headers: JSONH,
      body: { PageIndex: pi, PageSize: 100, KeyWords: '', SpecialType: 0, PortalId: c.portalId, DisplayFields: ['Category', 'Kind', 'LocId', 'ClassificationOne'] } });
    if (d.Code !== 200) throw new Error(`zhiye ${c.host}: ${d.Message}`);
    L.push(...(d.Data || [])); if (!d.Data?.length || L.length >= d.Count) { if (L.length < d.Count) throw new Error(`zhiye 少页 ${L.length}/${d.Count}`); break; }
  }
  const jobs = [...new Map(L.map(j => [j.Id, j])).values()].map(j => { const cat = j.Category || '', intern = j.Kind === '实习' || /实习/.test(cat);
    return rec(c.company, j.JobAdName, (j.LocNames || []).map(x => x.split('·').at(-1)), j.Require, `https://${c.host}/${intern ? 'intern' : 'campus'}/detail?jobAdId=${j.Id}`,
      intern ? '实习' : /社/.test(cat) ? '社招' : '校招', now); });
  return { jobs, stat: { raw: L.length } };
}

// 荣耀 wecruit：listPosition 分页（每页 15）+ listPositionDetail 取任职要求
async function honor(c) {
  const S = c.suite, now = nowIso(), L = [], B = `https://career.honor.com/wecruit/positionInfo`, Q = '?iSaJAx=isAjax&request_locale=zh_CN', H = { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' };
  for (let p = 1; ; p++) {
    const f = (await request(`${B}/listPosition/${S}${Q}`, { method: 'POST', headers: H, body: `recruitType=1&pageSize=15&currentPage=${p}` })).data?.pageForm;
    if (!f) throw new Error('honor: 列表无 pageForm'); L.push(...(f.pageData || [])); if (p >= f.totalPage || !f.pageData?.length) break;
  }
  const jobs = [...new Map(L.map(x => [x.postId, x])).values()].map(x => ({ _detail: async () => {
      const dd = await request(`${B}/listPositionDetail/${S}${Q}`, { method: 'POST', headers: H, body: `postId=${x.postId}&recruitType=1` });
      if (String(dd.state) !== '200') throw new Error(`honor 详情 ${x.postId}: ${String(dd.message || '').slice(0, 80)}`); return dd.data?.serviceCondition || ''; },
    ...rec('荣耀', x.postName, x.workPlaceStr || '', '', `https://career.honor.com/${S}/pb/posDetail.html?postId=${x.postId}&postType=campus`, '校招', now) }));
  return { jobs, stat: { raw: L.length } };
}

// 腾讯音乐 uc-job：type 10/40=校招，20/30=实习；详情取 requirement
async function tme() {
  const T = { 10: '校招', 20: '实习', 30: '实习', 40: '校招' }, now = nowIso(), L = [];
  for (const t of Object.keys(T)) {
    const d = (await request('https://join.tencentmusic.com/api/uc-job/list', { method: 'POST', headers: JSONH, body: { page: 1, ss: 500, type: t, job_class: [], work_city: '', setid: '', keyword: '' } })).data;
    if ((d.items || []).length !== +d._meta.total_count) throw new Error(`tme type ${t}: ${d.items?.length}/${d._meta.total_count}`);
    L.push(...d.items.map(x => [x, T[t]]));
  }
  const seen = new Set(), jobs = [];
  for (const [x, jt] of L) { if (seen.has(x.id + jt)) continue; seen.add(x.id + jt);
    jobs.push({ _detail: async () => { const i = await request(`https://join.tencentmusic.com/api/uc-job/info?id=${x.id}`, { headers: UA }); if (String(i.code) !== '200') throw new Error(`tme 详情 ${x.id}`); return i.data?.requirement || i.data?.require || ''; },
      ...rec('腾讯音乐', x.name, (x.work_city || []).map(k => k.label), '', `https://join.tencentmusic.com/campus/post-details/?id=${x.id}`, jt, now) }); }
  return { jobs, stat: { raw: L.length } };
}

// 理想汽车：school/job-page 一次取全；job_mode_name/subject_name 含实习 → 实习
async function lixiang() {
  const B = 'https://www.lixiang.com/osd-hr-recruitment-website/v1/recruit/', now = nowIso();
  const d = (await request(B + 'school/job-page?page=1&page_size=2000', { headers: UA })).data, L = d.items || [];
  if (L.length !== d.total_count) throw new Error(`lixiang ${L.length}/${d.total_count}`);
  const jobs = L.map(x => ({ _detail: async j => { const dd = await request(B + `job/detail?job_id=${x.id}`, { headers: UA }); if (dd.code !== 0) throw new Error(`lixiang 详情 ${x.id}`);
      if (/实习/.test(dd.data?.subject_name || '')) j.job_type = '实习'; return strip(dd.data?.requirements); },
    ...rec('理想汽车', x.title, x.location_title, '', `https://www.lixiang.com/employ/detail/${x.id}.html?jobCode=${x.code}`, /实习/.test(x.job_mode_name || '') ? '实习' : '校招', now) }));
  return { jobs, stat: { raw: L.length } };
}

// 联想：projectType 1/3=校招，2=实习；城市代码查 sysDict city_portal
async function lenovo() {
  const H = { headers: UA }, B = 'https://talent.lenovo.com.cn/gateway/jobBase/list', now = nowIso();
  const CITY = {}; for (const x of (await request('https://talent.lenovo.com.cn/gateway/sysDict/all', H)).result) if (x.dictCode === 'city_portal') for (const c of x.children) CITY[String(c.dictValue)] = c.dictName;
  const jobs = []; let raw = 0;
  for (const t of [1, 2, 3]) {
    const r = (await request(`${B}?projectType=${t}&pageNum=1&pageSize=500`, H)).result; if (r.rows.length !== r.total) throw new Error(`lenovo ${t} ${r.rows.length}/${r.total}`); raw += r.rows.length;
    for (const x of r.rows) jobs.push({ _detail: async () => { const d = (await request(`${B}?jobId=${x.id}`, H)).result.rows; if (d?.length !== 1 || d[0].id !== x.id) throw new Error(`lenovo 详情 ${x.id}`); return strip(d[0].jobRequirement); },
      ...rec('联想', x.jobName, String(x.workPlace || '').split(/[,，]/).map(k => k.trim()).filter(Boolean).map(k => CITY[k] || '未知代码' + k), '', `https://talent.lenovo.com.cn/position/detail?id=${x.id}&projectType=${t}`, t === 2 ? '实习' : '校招', now) });
  }
  return { jobs, stat: { raw } };
}

// Manus tRPC：一次返回全部，只收 type 含实习
async function manus() {
  const u = 'https://careers.manus.im/api/trpc/applications.publicJobs?input=' + encodeURIComponent(JSON.stringify({ json: { locale: 'zh' } }));
  const L = (await request(u, { headers: UA })).result.data.json, now = nowIso();
  const jobs = L.filter(j => /实习/.test(j.type || '')).map(j => rec('Manus', j.title, (j.locations || []).map(x => typeof x === 'string' ? x : x.name || x.city || '').filter(Boolean), strip(j.descriptionHtml), `https://careers.manus.im/cn/job/${j.id}`, '实习', now));
  return { jobs, stat: { raw: L.length } };
}

module.exports = { zhiye, honor, tme, lixiang, lenovo, manus };
