// 分类回归测试：node scripts/test_classify.js（规则见 scripts/reference/CLASSIFIER.md）
const { classify } = require('./lib/common');
const cases = [
  ['优才-运控算法工程师-Genie业务部', null], ['运营专员-XX研究院', '运营'], ['产品经理-研发中心', '产品'],
  ['产品研发实习生', null], ['测试运营实习生', '运营'], ['游戏测试实习生', null], ['产品运营', '运营'],
  ['管培生', '其他'], ['商务管培生', '商务'], ['单车业务-数据运营实习生', '运营'], ['招聘实习生 - 产品研发', '职能'],
  ['AI研究与运营实习生-抖音UGC', '运营'], ['国际化前端产品实习生', '产品'], ['市场实习生-开发者AI', '市场'],
  ['AI Agent前端实习生-开发者服务', null], ['校园招聘及雇主品牌实习生', '职能'], ['智算产品经理', 'AI产品'], ['混元多模态-视觉智能体强化学习关键技术研究', null], ['多模态世界模型研究与应用-阿里星', null], ['用户研究', '其他'],
];
let bad = 0;
for (const [t, want] of cases) { const got = classify(t); if (got !== want) { bad++; console.log('FAIL', t, 'want', want, 'got', got); } }
console.log(bad ? `${bad} 条失败` : `全部 ${cases.length} 条通过`); process.exit(bad ? 1 : 0);
