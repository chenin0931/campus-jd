#!/usr/bin/env node
// 读 staging/<周>/link_check/**/<数据集>_<序号>.json（格式见 staging/<周>/link_check_format.md）→ 写进 data/link_status.json。
// 批次按 (数据集, 序号) 升序应用，后面的覆盖前面的。status 映射（code 都以 manual-browser 开头，manualFresh 14 天有效期适用）：
//   ok           → {status:ok,         code:manual-browser-verified}
//   fixed        → {status:ok,         code:manual-browser-verified, new_url}（build 用 new_url 替换投递链接，id 不变）
//   not_found    → {status:invalid,    code:manual-browser-not-found}（显示 ❌疑似下架；14 天后回到待核）
//   unverifiable → {status:unverified, code:manual-browser-unverifiable}（继续 ⚠️链接待核）
// 用法：node scripts/import_link_check.js [--week 2026-W44] [--dir <目录>] [--dry-run]
const fs = require('fs'), path = require('path');
const { args } = require('./lib/common');
const a = args(), ROOT = path.join(__dirname, '..'), week = a.week || '2026-W44';
{
  const known = new Set(['week', 'dir', 'dry-run', 'dryRun', 'dataset', '_']);
  const unknown = Object.keys(a).filter(k => !known.has(k));
  if (a.help || a.h || unknown.length) {
    console.log('用法：node scripts/import_link_check.js [--week 2026-W44] [--dir <目录>] [--dataset 初创|全网] [--dry-run]');
    if (unknown.length && !a.help && !a.h) console.error('未知参数：' + unknown.join(', ') + '，未做任何修改');
    process.exit(unknown.length && !a.help && !a.h ? 1 : 0);
  }
}
const DIR = a.dir ? path.resolve(a.dir) : path.join(ROOT, 'staging', week, 'link_check'), OUT = path.join(ROOT, 'data', 'link_status.json');
const MAP = { ok: ['ok', 'manual-browser-verified'], fixed: ['ok', 'manual-browser-verified'], not_found: ['invalid', 'manual-browser-not-found'], unverifiable: ['unverified', 'manual-browser-unverifiable'] };
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : /^[^_]+_\d+\.json$/.test(e.name) && (!a.dataset || e.name.startsWith(a.dataset + '_')) ? [path.join(d, e.name)] : []) : [];
const key = f => { const m = path.basename(f).match(/^([^_]+)_(\d+)\.json$/); return [m[1], +m[2]]; };
const files = walk(DIR).sort((x, y) => { const [a1, b1] = key(x), [a2, b2] = key(y); return a1.localeCompare(a2) || b1 - b2; });
// 库里现有 id（当周 site/index 不一定有，直接读 data/<周> 太慢；用 state.json 的 jobs）
const known = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'state.json'), 'utf8')).jobs || {}));
const res = JSON.parse(fs.readFileSync(OUT, 'utf8')), errs = [], sum = {}, now = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00';
for (const f of files) {
  const b = JSON.parse(fs.readFileSync(f, 'utf8')), rel = path.relative(ROOT, f);
  if (!Array.isArray(b.roles)) { errs.push(`${rel}: 缺 roles 数组`); continue; }
  for (const [i, r] of b.roles.entries()) {
    const at = `${rel} #${i + 1} ${r.id}`, m = MAP[r.status];
    if (!known.has(r.id)) { errs.push(`${at}: 库里没有这个 id`); continue; }
    if (!m) { errs.push(`${at}: status 不认识 ${r.status}`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.verified_at || '')) { errs.push(`${at}: verified_at 不是 YYYY-MM-DD`); continue; }
    if (r.status === 'fixed' && !/^https?:\/\//.test(r.new_url || '')) { errs.push(`${at}: fixed 缺 new_url`); continue; }
    res[r.id] = { status: m[0], code: m[1], verified_at: r.verified_at, checked_at: now, source_file: rel, ...(r.status === 'fixed' ? { new_url: r.new_url } : {}), ...(r.notes ? { notes: r.notes } : {}) };
    sum[r.status] = (sum[r.status] || 0) + 1;
  }
}
console.log(`${files.length} 个批次文件`, JSON.stringify(sum));
if (errs.length) console.warn(`跳过 ${errs.length} 条：\n  ` + errs.join('\n  '));
if (!a['dry-run']) fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n');
