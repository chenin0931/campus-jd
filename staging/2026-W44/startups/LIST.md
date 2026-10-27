# AI创业公司候选清单 (2026-W44) — 按平台分组
排除: 智谱/月之暗面/MiniMax/阶跃星辰/商汤/科大讯飞 (另一 worker 负责)。线索来源仅作线索，数据只取官方。
校招/实习 列: 飞书数据为本周 API 实测 (recruit_type)；其余为官方页面/线索所示，待核。

## 飞书招聘 (website-path 均经 API 实测)
| 公司 | 发现来源 | 官方招聘 URL | website-path | 校招/实习 | Step3 |
|---|---|---|---|---|---|
| 面壁智能 | 媒体(机器之心/量子位)常见; 官网 | https://modelbest.jobs.feishu.cn/campus | campus (另 career=社招96) | 实习55+校招正式4 | modelbest.json 29条 |
| 智元机器人 | 线索 guet.edu.cn 就业网 → agirobot.jobs.feishu.cn/s/TaMTWEVTd_M | https://agirobot.jobs.feishu.cn/campusrecruitment | campusrecruitment (另 index=社招80) | 校招394+实习17 | agibot.json 124条 |
| 千寻智能 | 红杉中国 portfolio; 线索 career.cuhk.edu.cn | https://nwd4iy9rd2s.jobs.feishu.cn/campusofSpiritAI | campusofSpiritAI | 校招31+实习24 | spiritai.json 19条 |
| 生数科技 | 媒体/启明·BV百度风投投资 | https://shengshu.jobs.feishu.cn/index | index | 社招门户: 社招/实习22 | shengshu.json 实习16 |
| 零一万物 | 创新工场孵化 | https://01ai.jobs.feishu.cn/index | index | 社招门户: 社招/实习11 | 01ai.json 实习6 |
| 无问芯穹 | 媒体(量子位) | https://infinigence.jobs.feishu.cn/infinigence | infinigence | 仅社招全职51, 无实习 | 0 |
| 出门问问 | 媒体 | https://mobvoi.jobs.feishu.cn/index | index | 仅社招全职9, 无实习 | 0 |
| 光轮智能 | 奇绩 2026春 demo day (hub.baai.ac.cn/view/55384) | https://lightwheel.jobs.feishu.cn/index | index | 社招门户: 社招/实习9 | lightwheel.json 实习6 |
| 智平方 | 线索 career.nankai.edu.cn | https://ai2robotics.jobs.feishu.cn/index | index | 社招门户: 社招/实习7 | ai2robotics.json 实习1 |
| 爱诗科技 PixVerse | 媒体 | https://aisphere.jobs.feishu.cn/join | join | 社招门户: 社招/实习5 | aisphere.json 实习3 |
| 自变量机器人 | 媒体 | https://x2-robot.jobs.feishu.cn/912130 | 912130 | recruit_type 为空(详情 API 亦无), 按文本规则 | x2robot.json 实习21 |
| 逐际动力 | 媒体 | https://career.limxdynamics.com/index (飞书自有域名) | index | 社招门户: 社招/实习13 | limx.json 实习5 |

## Moka
| 公司 | 来源 | 官方URL | org / siteId | 校招/实习 |
|---|---|---|---|---|
| 银河通用 | 线索 career.nankai.edu.cn | https://app.mokahr.com/campus-recruitment/yinhetongyong/165930 | yinhetongyong / 165930 | 2027届校招页 (未抓取, 加密列表) |
| DeepSeek(幻方) | 媒体 | https://talent.deepseek.com (Moka high-flyer) | high-flyer / 140576 | 社招为主, 校招未见 |
| 傅利叶 | 线索(聚合站) | 官网招聘→Moka | org id 未确认 | 线索称校招~14/实习~6, 待核 |

## 北森
| 元象XVERSE | 媒体 | https://portal-oss.zhiye.com/611164 | zhiye.com 611164 | 待核 |

## 自建官网
| 公司 | 来源 | 官方URL | 校招/实习 |
|---|---|---|---|
| 百川智能 | 媒体 | https://careers.baichuan-inc.com/origin-program | 源点计划: 应届+实习 |
| 宇树科技 | 媒体 | https://www.unitree.com/cn/position | 待核 |
| 星海图 | 媒体 | https://galaxeadynamics.com/career/2027campus | 2027校招 |
| 飞象星球 | 媒体 | https://hr.feixiangxingqiu.com | 2027星舰计划 校招+实习 |
| 滴普科技 | 媒体 | https://deepexi.com/join-us/campus | 校招页 |
| Manus | 媒体 | https://careers.manus.im/cn | 实习 |
| 原力灵机 Dexmal | 媒体 | 平台未确认 | 待核 |

## 无官方招聘页 / 不明
| 硅基流动 | 奇绩/媒体 | 官网无招聘页, 仅聚合站 | — |
| 深势科技 | 媒体 | 仅公众号推文 | — |
| 潞晨科技 | 媒体 | 仅邮箱 resume@luchentech.com | — |
| LiblibAI | 媒体 | liblibai.jobs.feishu.cn 跳转 resonate.jobs.feishu.cn (归属未核) | — |

共 28 家 (飞书12, Moka3, 北森1, 自建7, 无/不明4)。


更新 (2026-10-27 16:1x): 社招门户仅保留实习岗 (标题或 recruit_type 含实习)；自变量按文本规则。分类按 CLASSIFIER.md (含智算→AI产品、招聘/雇主品牌→职能)。


## 2026-W44 大厂/新增公司 staging 计数 (2026-10-27 17:xx，按 scripts/lib/common.js classify @2b42286b；startups 见 startups_node/)
| 文件 | 合计 | 校招 | 实习 | 分类 |
|---|---|---|---|---|
| 360.json | 44 | 7 | 37 | 运营10、职能9、分析5、AI产品4、其他4、市场3、设计3、销售2、商务2、项目管理1、产品1 |
| honor.json | 15 | 15 | 0 | 其他2、设计2、运营2、AI产品2、销售2、商务2、市场1、职能1、分析1 |
| iflytek.json | 47 | 47 | 0 | 运营11、市场8、其他7、项目管理5、销售4、产品3、设计3、职能3、分析2、商务1 |
| iqiyi.json | 83 | 0 | 83 | 运营28、其他17、产品12、设计8、市场6、AI产品6、职能3、分析2、商务1 |
| jd.json | 167 | 90 | 77 | 其他47、运营40、职能29、商务11、分析10、产品8、销售7、设计6、项目管理5、市场4 |
| ke.json | 31 | 13 | 18 | 运营11、职能6、AI产品5、其他3、产品2、商务1、设计1、策划1、市场1 |
| lenovo.json | 37 | 37 | 0 | 职能8、产品6、其他4、设计4、运营3、市场3、商务3、项目管理2、分析2、销售2 |
| lixiang.json | 412 | 149 | 263 | 销售122、其他81、运营64、职能34、产品28、市场25、设计24、AI产品10、分析10、商务8、项目管理6 |
| minimax.json | 30 | 6 | 24 | 运营7、其他6、AI产品6、市场5、分析3、职能1、策划1、产品1 |
| nio.json | 522 | 148 | 374 | 销售375、其他72、运营41、产品13、职能7、分析5、设计3、AI产品2、项目管理2、市场1、商务1 |
| pinduoduo.json | 25 | 23 | 2 | 运营7、职能7、其他5、商务2、产品2、分析1、市场1 |
| sensetime.json | 37 | 12 | 25 | 职能8、运营8、产品7、AI产品4、市场3、分析2、项目管理1、其他1、商务1、设计1、销售1 |
| tme.json | 99 | 24 | 75 | 运营33、其他16、产品12、分析11、市场9、职能8、设计5、商务3、项目管理2 |
| xpeng.json | 413 | 345 | 68 | 其他212、运营53、职能35、销售27、产品18、市场15、设计15、AI产品11、商务10、项目管理9、分析8 |

## 未收录
| 公司 | 状态 |
|---|---|
| 智谱 | 「无公开职位列表」（官网仅报名表 + 内推链接），未收录 |
| 月之暗面 / 阶跃星辰 / 知乎 / 微博 / Shopee(内地校招) | Moka 加密列表，等 moka.js |

## Round 2 (VC portfolios, 2026-10-27) — platform + identifier only, not scraped
| Company | VC | Platform | Identifier | Found on |
|---|---|---|---|---|
| 非夕 Flexiv | 真格 | 飞书 | flexivrobotics/index | flexiv.com |
| 思谋 SmartMore | 真格 | Moka | smartmore/143311 (social) | smartmore.com |
| 爱笔 Aibee | 真格 | Moka | aibee campus_apply/799, apply/800 | aibee.com |
| 舞肌 Wuji | 真格 | 飞书 | wuji (0 jobs) | wuji.tech/zh/careers |
| 加速进化 Booster | 源码 | 飞书 | booster/index | official site |
| 壁仞 Biren | 源码 | Moka | biren/44727 campus, 44726 social | official site |
| 星尘智能 Astribot | 锦秋 | Moka | astribot/144862 campus, 144861 social | astribot.com/careers |
| 流形空间 | 锦秋 | 飞书 (custom domain) | jobs.manifoldai.cn campus / index | official site |
| 它石智航 TARS | 线性 | 飞书 | tarsrobot/index | linear.vc portfolio |
| 特赞 Tezign | 线性 | 飞书 | tezign/index | tezign.com |
| 与爱为舞 | 真格 | own site | /aixue-join | official |
| 驭势 | 真格 | own site | joinus.html | official |
| UniPat | 锦秋 | own site | /joinus | official |
| 未来机器人 VisionNav | 锦秋 | own site | /join-us | official |
Unverified (no official link): 飞书 mogic (方舟无限?), mindverse (心识宇宙). No hiring found: 优艾智合, 炬星, 奥创光年, Sand.ai, 梅卡曼德 (email), 星猿哲, 擎朗, 云鲸, 首形 (email), 地瓜, 乐享, 数美万物, 深度原理, 造梦次元, PPIO, Simplexity, coScene (form only), FunctorZ (feishu 0).

### 2026-10-27 复核
| 公司 | 来源 | 入口 | id | 结果 |
|---|---|---|---|---|
| 傅利叶 | Moka（官网未链出） | app.mokahr.com/campus-recruitment/fftai/147078 | fftai/147078 | 25 条（校招 15/实习 10）；可收约 2 条（财务管培生、销售工程师）；待核 |
| 星海图 | 官网自建 + 北森 | galaxea-ai.com/zh/jobs.html；galaxea.zhiye.com | 北森无 portalId 参数可直接列 | 官网 18 条（可收 内容运营实习生 1）；北森 38 条（可收 全球经管人才计划（管培生）1）；北森记待核 |

## Ashby
| Meshy | SOURCES.md | https://jobs.ashbyhq.com/meshy | posting-api | 2026-10-27 起国内+海外实习都收；当前实习2(均国内) | meshy_overseas_backfill.json 2条 |
