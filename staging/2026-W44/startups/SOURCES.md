# 每周可复用渠道
- 奇绩 demo day 名单: https://hub.baai.ac.cn/view/55384 ; https://www.pingwest.com/a/314650 ; https://svtr.ai/orgs/miracleplus
- VC portfolio (待系统化): 红杉中国、真格、源码、线性、锦秋、蓝驰、启明、创新工场、经纬、BV百度风投、智谱Z基金
- 媒体: 量子位、机器之心、极客公园、甲子光年、36氪、暗涌、Founder Park、晚点
- 高校就业网(官方转发链接,作线索): career.nankai.edu.cn, guet.edu.cn, career.cuhk.edu.cn
- 平台探测: 飞书 https://<sub>.jobs.feishu.cn, API /api/v1/search/job/posts (website-path 头; 错误 path 返回 data=null); Moka app.mokahr.com/campus-recruitment/<org>/<site>; 北森 *.zhiye.com
- 抓取脚本: /tmp/fsfetch.py <公司> <base> <wp> <slug> (仅保留 校招/*; 社招/实习 跳过)

## Round 2 portfolio sources
真格 zhenfund.com/zhenfund.md · 源码 sourcecodecap.com/companies/ · 线性 linear.vc/portfolio · 锦秋 jinqiucapital.com/api/content · 蓝驰 lanchiventures.com/portfolio
## Moka ids
月之暗面 moonshot/148507 campus, apply/moonshot/148506 (careers.kimi.com/campus) · 阶跃 step/94905 campus, 94904 social (stepfun.com) · 知乎 campus_apply/zhihu/68321, apply/zhihu/78336 (zhihu.com/careers) · 新浪 sina/43536 · Shopee shopee/2962 (su/nykvgs) · 傅利叶 fftai/147078 (secondary)

## Verification notes (2026-10-27, POC 运营助手)
- 新浪/微博 sina/43536: accepted as official via 新浪招聘's official Weibo. The career domains fail with SSL errors from the box.
- 傅利叶 fftai/147078, 飞书 mogic and mindverse: stay UNVERIFIED and are not collected.

## Own-site interfaces (for 全栈开发者 to build fetchers; nothing scraped)
| Company | Platform | List | Detail / fake id | Notes |
|---|---|---|---|---|
| 百川 | 飞书 (link on careers.baichuan-inc.com/origin-program) | cq6qe6bvfr6.jobs.feishu.cn, campus path `646926` (16 roles: 11 校招/实习, 5 校招/正式), social path `baichuanzhaopin` (18 社招) | standard 飞书 | project ids 7676369353193589042 / 7676373343511251243 / 7676396828845639987 |
| 原力灵机 Dexmal | 飞书 (careersCampus/careersSocial in dexmal.com JS bundle) | dexmal-inc.jobs.feishu.cn, campus `285572` (43: 22 校招/实习, 21 校招/正式), social `index` (53: 1 社招/实习) | standard 飞书 | |
| 飞象星球 | Moka (in hr.feixiangxingqiu.com/config.js) | social-recruitment/**fenbi/193890** (org is 粉笔) | Moka | site only lists 5 job deep links, incl. an "internship" one |
| 驭势 | Moka (uisee.com/joinus.html) | campus_apply/yushi/3773 (302 live); apply/yushi/3774 (social); recommendation-apply/yushi/3775 | Moka | |
| Meshy | Ashby (meshy.ai/careers) | GET https://api.ashbyhq.com/posting-api/job-board/meshy, no pagination, 21 jobs | jobs.ashbyhq.com/meshy/<uuid> | fields: id,title,department,team,employmentType(Intern/FullTime),location,descriptionPlain. US/Shanghai, English titles. 2026-10-27 scope change: 不再限国内，海外实习也收(region 字段标注)；当前实习 2 条均国内，见 meshy_overseas_backfill.json |
| Manus | own tRPC API | GET https://careers.manus.im/api/trpc/applications.publicJobs?input={"json":{"locale":"zh"}} (URL-encoded), returns all 18 jobs in one call, no pagination. No input → 400 BAD_REQUEST | no detail endpoint; SPA route /cn/job/<uuid> reads the list response | fields: id(uuid),title,type(全职/实习),category,hot,summary,descriptionHtml,locations[] |
| 滴普 | own site, SSR (Nuxt) | GET https://deepexi.com/join-us/campus → job cards linking /join-us/campus/c1..c8 | GET /join-us/campus/c<N>, title in h1.join-detail-title. Fake id c999 → HTTP 200 empty shell (soft 404; check for missing h1) | 8 campus roles, 6 technical + 2 AI产品经理 |
| 宇树 | own site, SSR (Nuxt) | GET https://www.unitree.com/cn/position: 21 roles in HTML, titles carry codes like (J10005) | /cn/position/<19-digit id> | the backing API api.unitree.com/website/job/list + /job/info returns HTTP 567 WAF page to curl → BLOCKED, don't use. All 社招, no 实习 |
| UniPat | own site, static | https://unipat.ai/joinus: 3 roles in HTML (Agent Systems Engineer, Infra Engineer, Research Intern) | none | no API |
| 星海图 | 北森 lead: galaxea.zhiye.com (live, 200) | official galaxeadynamics.com/career/2027campus now redirects to a Shopify store with no job content or ATS link | — | 北森 id comes only from a third-party aggregator (锦鲤求职). UNVERIFIED |
| 与爱为舞 | unknown | aitutor100.com/aixue-join/ is a Vite SPA. Its bundle on fe-pub-hs-1.aiv5cdn.com timed out from the box | — | blocker |
| 未来机器人 VisionNav | none | visionnav.com/join-us has no listings; email info@visionnav.com only | — | |

## 2026-10-27 复核（全网招聘内容搜罗）
| 公司 | 平台/id | 官网是否链出 | 总数 | 非技术 / 实习 | 结论 |
|---|---|---|---|---|---|
| 傅利叶 | Moka orgId=fftai siteId=147078（campus、social 返回同一批 25 条，hireMode=2） | fftai.cn/career 只放公众号二维码，没有 Moka 链接；id 只出现在聚合站（锦鲤） | 25（校招 15、实习 10） | 非技术约 2（财务管培生、销售工程师）；实习 10 条全是技术岗 | 接口可用、岗位真实，但官网未链出，记「待核」，可收录 |
| 星海图 | ① 官网自建 www.galaxea-ai.com/zh/jobs.html（HTML 静态，jobId 11–28）② 北森 galaxea.zhiye.com（POST /api/Jobad/GetJobAdPageList，Count=38，页面标题「星海图招聘官网」） | ① 是官网本身；② 官网页面里没有链接（jobs.html 和 2027 校招公告里都没有 zhiye），校招公告给的 galaxeadynamics.com/career/2027campus 现在 404 | ① 18 条社招 ② 38 条 | ① 非技术：内容运营实习生、电商运营专员、营销策划经理、解决方案高级经理、数据运营×2；实习 2（内容运营实习生=非技术、灵巧手算法实习生）② 非技术：全球经管人才计划（管培生）、政企与商务负责人、知产经理、行政主管；实习 10 条全是技术 | ① 官方，可收「内容运营实习生」 ② 北森站真实，但官网未链出，记「待核」，管培生可收 |
