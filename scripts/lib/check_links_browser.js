#!/usr/bin/env node
// 可选兜底：用真实浏览器（Playwright）打开投递链接，判断岗位页是否真的渲染出来。每条链接新开页面重新 goto（hash 路由不复用）。
// 已知：京东/小红书/百度在无头模式下正文为空（记 unverified）；蚂蚁页面渲染为英文、岗位名对不上（会判 invalid，但因同公司无 ok 不写回）。
// 判定：页面标题（document.title 或岗位标题元素）为空 / 含 "undefined"，或正文里找不到 data 中的岗位名 → invalid；否则 ok。
// 依赖：npm i playwright（或 playwright-core + 环境变量 CHROME_PATH 指向本机 Chrome）。未安装时直接跳过、退出码 0。
// 用法：node scripts/lib/check_links_browser.js [--only kuaishou,jd] [--sample 5] [--fake] [--write] [--status unverified,format_verified]
//   --sample N  每家只抽 N 条；--fake 每家额外测 1 条假 id（沿用第 1 条的岗位名作期望，页面不该出现它 → 期望 invalid）；
//   --write     把结果写回 data/link_status.json（只覆盖未被详情接口判定过的条目，code=browser）
const fs = require('fs'), path = require('path');
const { args } = require('./common'), { postId } = require('./site');
let pw; try { pw = require('playwright'); } catch { try { pw = require('playwright-core'); } catch { console.log('未安装 playwright，跳过浏览器校验'); process.exit(0); } }
const a = args(), DATA = path.join(__dirname, '..', '..', 'data'), OUT = path.join(DATA, 'link_status.json');
const week = fs.readdirSync(DATA).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort().at(-1);
const only = a.only ? new Set(String(a.only).split(',')) : null, sample = a.sample ? +a.sample : Infinity;
const want = a.status ? new Set(String(a.status).split(',')) : null;
const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const todo = [];
for (const f of fs.readdirSync(path.join(DATA, week)).filter(f => f.endsWith('.json'))) {
  const slug = f.slice(0, -5); if (only && !only.has(slug)) continue;
  const jobs = JSON.parse(fs.readFileSync(path.join(DATA, week, f), 'utf8'))
    .map(j => ({ slug, id: `${slug}-${postId(j.apply_url)}`, url: j.apply_url, title: j.title }))
    .filter(t => !want || want.has(res[t.id]?.status || 'unchecked'));
  todo.push(...jobs.slice(0, sample));
  if (a.fake && jobs[0]) todo.push({ slug, id: null, fake: true, url: jobs[0].url.replace(/(\d{3,})(?!.*\d{3,})/, '9999999'), title: jobs[0].title });  // 期望标题仍用真岗位的：假 id 页面不该渲染出它
}
const norm = s => String(s || '').replace(/\s+/g, '');
(async () => {
  const launch = async () => { const b = await pw.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); return [b, await b.newContext({ locale: 'zh-CN' })]; };
  let [browser, ctx] = await launch(); const
  now = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00';
  const out = [];
  for (const t of todo) {
    let page, r;
    try { page = await ctx.newPage(); } catch { await browser.close().catch(() => {}); [browser, ctx] = await launch(); page = await ctx.newPage(); }  // 浏览器崩溃则重启
    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30e3 });
      await page.waitForLoadState('networkidle', { timeout: 8e3 }).catch(() => {});
      await page.waitForTimeout(1500);
      const { title, h, body } = await page.evaluate(() => ({ title: document.title, h: (document.querySelector('h1,h2,[class*="title" i]')?.innerText || '').trim(), body: document.body?.innerText || '' }));
      const shown = t.title ? norm(body).includes(norm(t.title).slice(0, 12)) : !!h && !/undefined/i.test(h) && !/undefined/i.test(title);
      if (!norm(body)) { r = { status: 'unverified', code: 'browser-empty' }; } else {  // 无头浏览器拿不到正文（京东/小红书/百度会这样）→ 不下结论
      const bad = (!title.trim() && !h) || /undefined/i.test(title) || /undefined/i.test(h) || !shown;
      r = { status: bad ? 'invalid' : 'ok', code: 'browser', page_title: (h || title).slice(0, 60) }; }
    } catch (e) { r = { status: 'unverified', code: 'browser-' + e.name }; }
    await page.close(); out.push({ ...t, ...r });
    console.log(`${t.fake ? '[假id]' : ''}${t.slug}\t${r.status}\t${r.page_title || r.code}\t${t.url}`);
  }
  await browser.close();
  // 写回规则：只有同公司本轮至少一条判 ok（说明页面能正常渲染、判定可信）时，才写入该公司的 invalid；详情接口的结论不覆盖
  const trusted = new Set(out.filter(o => !o.fake && o.status === 'ok').map(o => o.slug));
  if (a.write) for (const o of out) if (!o.fake && o.status !== 'unverified' && (o.status === 'ok' || trusted.has(o.slug)) && !/^detail-api/.test(res[o.id]?.code || '')) res[o.id] = { status: o.status, code: 'browser', checked_at: now };
  if (a.write) fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n');
  const sum = {}; for (const o of out) { const k = `${o.slug}${o.fake ? '(假)' : ''}:${o.status}`; sum[k] = (sum[k] || 0) + 1; } console.log(sum);
})();
