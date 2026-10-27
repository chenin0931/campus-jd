// 海外岗后处理（POC 2026-10-27）：收中国大陆 + 港澳台；港澳台以外的海外城市去掉。
// 城市全部为海外 → 删岗位；多城市 → 只去掉海外城市。见 scripts/reference/CLASSIFIER.md §11。
// 判定用显式清单（不是"不认识就当海外"），避免误删国内小城市；新海外城市出现时补进 OVERSEAS。
const OVERSEAS = new Set(('东京 日本 首尔 新加坡 新加坡共和国 吉隆坡 雅加达 曼谷 泰国 胡志明 河内 马尼拉 班加罗尔 Gurugram 拉合尔 卡拉奇 迪拜 利雅得 科威特城 麦纳麦 多哈 埃尔比勒 伊斯坦布尔 ' +
  '开罗 约翰内斯堡 罗安达 阿比让 卡萨布兰卡 拉各斯 内罗毕 莫斯科 阿拉木图 塔什干 伦敦 巴黎 布洛涅-比扬古 慕尼黑 杜塞尔多夫 法兰克福 柏林 阿姆斯特丹 米兰 马德里 巴塞罗那 布达佩斯 布加勒斯特 布拉格 布拉格直辖 华沙 贝尔格莱德 ' +
  '墨西哥城 圣保罗 波哥大 利马 圣地亚哥 布宜诺斯艾利斯 美国 旧金山 森尼韦尔 西雅图 纽约 洛杉矶 圣何塞 硅谷 悉尼 墨尔本 奥克兰 巴亭 英国 德国 法国 巴西 印度 印尼 越南 菲律宾 马来西亚 沙特 阿联酋 俄罗斯 墨西哥 澳大利亚 加拿大 多伦多 奥斯陆 迪门 巴勒鲁普 哥本哈根 斯德哥尔摩 赫尔辛基').split(' '));
// 「国家-城市」形式（Workday：US-California、Malaysia-Kuala Lumpur、英国-伦敦）
const COUNTRY = /^(US|USA|United States|United Kingdom|UK|Australia|Brazil|France|Germany|Malaysia|Netherlands|New Zealand|S\.?\s?Korea|South Korea|Korea|Japan|Thailand|UAE|Singapore|Indonesia|India|Vietnam|Philippines|Mexico|Canada|Spain|Italy|Saudi Arabia|Turkey|Egypt|英国|美国|德国|法国|日本|韩国|泰国|新加坡|马来西亚|澳大利亚|巴西|墨西哥|阿联酋|沙特|印度|印尼|越南)\s*-/i;
const DOMESTIC = /中国|香港|澳门|台湾|台北|省|自治区|^(北京|上海|天津|重庆)/;
const isOverseas = c => { const x = String(c || '').trim(); if (!x || DOMESTIC.test(x)) return false; return OVERSEAS.has(x) || COUNTRY.test(x); };
// 返回 { jobs, deleted:[job], modified:[{job, removed:[city]}] }；不改入参
function stripOverseas(jobs) {
  const out = [], deleted = [], modified = [];
  for (const j of jobs) {
    const cs = Array.isArray(j.city) ? j.city : (j.city ? [j.city] : []);
    const os = cs.filter(isOverseas);
    if (!os.length) { out.push(j); continue; }
    if (os.length === cs.length) { deleted.push(j); continue; }
    const k = { ...j, city: cs.filter(c => !isOverseas(c)) }; out.push(k); modified.push({ job: k, removed: os });
  }
  return { jobs: out, deleted, modified };
}
module.exports = { isOverseas, stripOverseas, OVERSEAS };
