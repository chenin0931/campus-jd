// 构建共用：slug、id。
const COMPANY = { bytedance: '字节跳动', tencent: '腾讯', alibaba: '阿里巴巴', antgroup: '蚂蚁集团', kuaishou: '快手', meituan: '美团', xiaohongshu: '小红书',
  jd: '京东', pinduoduo: '拼多多', netease: '网易', didi: '滴滴', xiaomi: '小米',
  bilibili: '哔哩哔哩', dewu: '得物', oppo: 'OPPO', mihoyo: '米哈游', ctrip: '携程', vivo: 'vivo', huawei: '华为' };
const CATS = { 'AI产品': 'ai-product', '产品': 'product', '运营': 'ops', '商务': 'business', '市场': 'marketing', '销售': 'sales', '设计': 'design', '职能': 'corporate', '项目管理': 'pm', '分析': 'analysis', '策划': 'planning', '供应链': 'supply', '其他': 'other' };
const TYPES = { '校招': 'campus', '实习': 'intern' };
const CITY = { 北京: 'beijing', 上海: 'shanghai', 深圳: 'shenzhen', 杭州: 'hangzhou', 广州: 'guangzhou', 成都: 'chengdu', 香港: 'hongkong', 珠海: 'zhuhai',
  西安: 'xian', 武汉: 'wuhan', 南京: 'nanjing', 厦门: 'xiamen', 济南: 'jinan', 青岛: 'qingdao', 重庆: 'chongqing', 澄迈: 'chengmai', 东京: 'tokyo',
  天津: 'tianjin', 苏州: 'suzhou', 长沙: 'changsha', 合肥: 'hefei', 郑州: 'zhengzhou', 新加坡: 'singapore', 新加坡共和国: 'singapore', 远程: 'remote',
  大连: 'dalian', 沈阳: 'shenyang', 宿迁: 'suqian', 兰州: 'lanzhou', 南昌: 'nanchang', 宁波: 'ningbo', 昆明: 'kunming', 南宁: 'nanning', 哈尔滨: 'harbin',
  '全国/不限': 'nationwide', 全国多地: 'nationwide', 不限: 'nationwide', 全国: 'nationwide', 雄安: 'xiongan', 广东省: 'guangdong-province', 东莞: 'dongguan', 南通: 'nantong', 桂林: 'guilin', 嘉定区: 'shanghai', 房山区: 'beijing', 建邺区: 'nanjing', 崂山区: 'qingdao' };
// 未列出的城市归入 other（显示为“其他城市”，详情页保留原城市名）
// 归一城市名：去“总部/市/县/中国”等
// 「广东省-深圳市」「北京市-北京市」「江苏省-南京市-建邺区」取市级段
const normCity = c => { let x = String(c).replace(/^中国/, '').trim(); const seg = x.split(/\s*-\s*/); if (seg.length > 1 && /(省|市|自治区)$/.test(seg[0])) x = /市$/.test(seg[1]) || seg.length === 2 ? seg[1] : seg[0]; return x.replace(/(总部|市|县|特别行政区)$/, '').trim(); };
const citySlug = c => CITY[normCity(c)] || 'other';
// postId：apply_url 中最后一段数字
// postId：腾讯 ?postid=（可为负数/短数字，如汇总入口 postid=-123）优先取参数原值；URL 含 UUID 则取 UUID；含 ?id=/&id= 数字参数则取它（网易 ...?id=4805&projectId=103 不能取 projectId）；含「字母前缀+数字」的完整 id（携程 MJ037349）则原样取；否则取最后一段 ≥3 位纯数字；再否则取最后一个路径/参数 token（小写）
const postId = u => { const x = String(u).split('#').at(-1) === String(u) ? String(u) : String(u);
  return (x.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0]?.toLowerCase() ||
    (x.match(/[?&]postid=(-?\d+)/i) || [])[1] || (x.match(/[?&]id=(\d+)/) || [])[1] || (x.match(/\/([A-Z]{2,4}\d{4,})(?:[?#/]|$)/) || [])[1] || (x.match(/(\d{3,})(?!.*\d{3,})/) || [])[1] || (x.match(/.*[/=]([A-Za-z0-9][A-Za-z0-9_-]{5,})/) || [])[1]?.toLowerCase(); };
// 同一文件内多个不同岗位共用一个 URL（如拼多多手工录入的 /campus/grad）时 postId 会撞车：改用 h+sha1(标题|URL) 前 10 位
const uniqIds = jobs => { const crypto = require('crypto'), by = {};
  for (const j of jobs) (by[j.pid] ||= new Set()).add(j.title);
  for (const j of jobs) if (by[j.pid].size > 1) j.pid = 'h' + crypto.createHash('sha1').update(j.title + '|' + j.apply_url).digest('hex').slice(0, 10);
  return jobs; };
module.exports = { uniqIds, COMPANY, CATS, TYPES, CITY, normCity, citySlug, postId };

// 人工核验（code=manual-browser-verified）有效期：verified_at（YYYY-MM-DD，北京时间）起 14 天内保持 ok，超期或缺日期 → 回到待核，等重新人工核验。
const MANUAL_VERIFY_DAYS = 14;
const manualFresh = (e, today) => !!(e && e.code === 'manual-browser-verified' && e.status === 'ok' && /^\d{4}-\d{2}-\d{2}$/.test(e.verified_at || '') &&
  (Date.parse(today) - Date.parse(e.verified_at)) / 864e5 <= MANUAL_VERIFY_DAYS);
module.exports.MANUAL_VERIFY_DAYS = MANUAL_VERIFY_DAYS; module.exports.manualFresh = manualFresh;
