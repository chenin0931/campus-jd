// 从官网结构化字段（优先）或标题+岗位要求正文（正则）抽取届别 grad_year 和实习时长 intern_duration。
// grad_year: 升序整数数组（如 [2027]；「2028届及以后」→ [2028, 2029]），抽不到为 null。
// intern_duration: 如「≥3个月」「≥6个月，每周≥4天」，抽不到为 null；只对实习岗抽取。
const YR = y => (y < 100 ? 2000 + y : y);
function gradYear(j) {
  const ys = new Set(); let after = false;
  const scan = s => {
    s = String(s || '');
    for (const m of s.matchAll(/(?<!\d)((?:20)?\d{2})\s*(?:届|级)(?:毕业生)?(及以后|及之后|以后)?/g)) { const y = YR(+m[1]); if (y >= 2024 && y <= 2032) { ys.add(y); if (m[2]) after = true; } }
    for (const m of s.matchAll(/(?<!\d)(\d{2})\s*[\/、和或]\s*(\d{2})\s*届/g)) { ys.add(YR(+m[1])); ys.add(YR(+m[2])); }  // 「27/28届」
    // 「2026年10月1日至2027年9月30日期间毕业」→ 取结束年；「2027年毕业」→ 2027
    for (const m of s.matchAll(/(20\d{2})\s*年[^。；\n]{0,20}?(?:至|-|~|到)\s*(20\d{2})\s*年[^。；\n]{0,15}?毕业/g)) ys.add(+m[2]);
    if (!ys.size) for (const m of s.matchAll(/(?<!\d)(20\d{2})\s*年(?:\d{1,2}月)?[^。；\n至到]{0,6}?毕业/g)) ys.add(+m[1]);
  };
  if (j.project) scan(j.project);            // 结构化：飞书系 job_subject（如「2027届校园招聘」）
  if (!ys.size) scan(j.title + '\n' + j.requirements);
  if (!ys.size) return null;
  const l = [...ys].sort(); if (after) l.push(l.at(-1) + 1);
  return [...new Set(l)];
}
const CN = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十二: 12 };
const num = s => (/^\d+$/.test(s) ? +s : CN[s]);
function internDuration(j) {
  if (j.job_type !== '实习') return null;
  const t = String(j.requirements || '') + '\n' + j.title; let mo = null, d = null;
  const M = /(?:实习|到岗|持续|时长|时间|至少|不少于|不低于|保证|可|能)[^。；\n]{0,12}?(\d+|[一二两三四五六七八九十]+)\s*(?:[-~至到]\s*(?:\d+|[一二两三四五六七八九十]+)\s*)?个?\s*月/;
  const m1 = t.match(M) || t.match(/(\d+|[一二两三四五六七八九十]+)\s*个月(?:及|或)?以上/); if (m1) mo = num(m1[1]);
  else if (/(?:实习|周期|时间|不少于|至少)[^。；\n]{0,8}?半年/.test(t)) mo = 6; else if (/(?:实习|周期|时间|不少于|至少)[^。；\n]{0,8}?一年/.test(t)) mo = 12;
  const m2 = t.match(/每周[^。；\n]{0,8}?(\d|[一二三四五])\s*(?:[-~至到]\s*\d\s*)?天/); if (m2) d = num(m2[1]);
  if (!mo && !d) return null;
  return [mo ? `≥${mo}个月` : null, d ? `每周≥${d}天` : null].filter(Boolean).join('，');
}
module.exports = { gradYear, internDuration };
