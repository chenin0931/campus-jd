// 构建共用：slug、id。
const COMPANY = { bytedance: '字节跳动', tencent: '腾讯', alibaba: '阿里巴巴', antgroup: '蚂蚁集团', kuaishou: '快手', meituan: '美团', xiaohongshu: '小红书',
  jd: '京东', pinduoduo: '拼多多', netease: '网易', didi: '滴滴', xiaomi: '小米',
  bilibili: '哔哩哔哩', dewu: '得物', oppo: 'OPPO', mihoyo: '米哈游', ctrip: '携程', vivo: 'vivo', huawei: '华为' };
const CATS = { 'AI产品': 'ai-product', '产品': 'product', '运营': 'operations' };
const TYPES = { '校招': 'campus', '实习': 'intern' };
const CITY = { 北京: 'beijing', 上海: 'shanghai', 深圳: 'shenzhen', 杭州: 'hangzhou', 广州: 'guangzhou', 成都: 'chengdu', 香港: 'hongkong', 珠海: 'zhuhai',
  西安: 'xian', 武汉: 'wuhan', 南京: 'nanjing', 厦门: 'xiamen', 济南: 'jinan', 青岛: 'qingdao', 重庆: 'chongqing', 澄迈: 'chengmai', 东京: 'tokyo',
  天津: 'tianjin', 苏州: 'suzhou', 长沙: 'changsha', 合肥: 'hefei', 郑州: 'zhengzhou', 新加坡: 'singapore', 新加坡共和国: 'singapore', 远程: 'remote',
  大连: 'dalian', 沈阳: 'shenyang', 宿迁: 'suqian', 兰州: 'lanzhou', 南昌: 'nanchang', 宁波: 'ningbo', 昆明: 'kunming', 南宁: 'nanning', 哈尔滨: 'harbin',
  东莞: 'dongguan', 南通: 'nantong', 桂林: 'guilin', 嘉定区: 'shanghai', 房山区: 'beijing', 建邺区: 'nanjing', 崂山区: 'qingdao' };
// 未列出的城市归入 other（显示为“其他城市”，详情页保留原城市名）
// 归一城市名：去“总部/市/县/中国”等
const normCity = c => String(c).replace(/^中国/, '').replace(/(总部|市|县|特别行政区)$/, '').trim();
const citySlug = c => CITY[normCity(c)] || 'other';
// postId：apply_url 中最后一段数字
// postId：URL 含 UUID 则取 UUID；含 ?id=/&id= 数字参数则取它（网易 ...?id=4805&projectId=103 不能取 projectId）；含「字母前缀+数字」的完整 id（携程 MJ037349）则原样取；否则取最后一段 ≥3 位纯数字；再否则取最后一个路径/参数 token（小写）
const postId = u => { const x = String(u).split('#').at(-1) === String(u) ? String(u) : String(u);
  return (x.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0]?.toLowerCase() ||
    (x.match(/[?&]id=(\d+)/) || [])[1] || (x.match(/\/([A-Z]{2,4}\d{4,})(?:[?#/]|$)/) || [])[1] || (x.match(/(\d{3,})(?!.*\d{3,})/) || [])[1] || (x.match(/.*[/=]([A-Za-z0-9][A-Za-z0-9_-]{5,})/) || [])[1]?.toLowerCase(); };
module.exports = { COMPANY, CATS, TYPES, CITY, normCity, citySlug, postId };
