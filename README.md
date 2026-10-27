# 大厂非技术岗（产品/运营/商务/市场/销售/设计/职能/项目管理/分析/策划/供应链）校招·实习 JD 库（每周更新）

GitHub Actions 每周一自动抓取各大厂校招官网的公开岗位，在服务端算好按**公司 × 校招/实习 × 类别 × 城市**切分的小文件（每个 ≤8KB），发布到 GitHub Pages。学生的 AI 助手（WorkBuddy 等）装上 skill 后，只需 fetch 两三个小文件就能回答“上海有哪些 AI 产品实习”。

## 总览
<!-- overview:start -->
数据周 **2026-W44**（2026-10-27 生成）· 在招 **7254** · 本周新增 **0** · 下架 **0**

| 公司 | 校招 | 实习 | 合计 |
|---|---:|---:|---:|
| 阿里巴巴 | 116 | 0 | 116 |
| 蚂蚁集团 | 19 | 29 | 48 |
| 百度 | 61 | 307 | 368 |
| 哔哩哔哩 | 35 | 242 | 277 |
| 字节跳动 | 859 | 2201 | 3060 |
| 携程 | 37 | 22 | 59 |
| 得物 | 133 | 5 | 138 |
| 滴滴 | 43 | 455 | 498 |
| 华为 | 21 | 11 | 32 |
| 京东 | 80 | 70 | 150 |
| 快手 | 169 | 76 | 245 |
| 美团 | 73 | 197 | 270 |
| 米哈游 | 74 | 84 | 158 |
| 网易 | 86 | 529 | 615 |
| OPPO | 45 | 31 | 76 |
| 拼多多 | 27 | 2 | 29 |
| 腾讯 | 71 | 183 | 254 |
| vivo | 10 | 27 | 37 |
| 小红书 | 34 | 183 | 217 |
| 小米 | 316 | 291 | 607 |
<!-- overview:end -->

## 使用教程（学生）
1. 下载 [`skill/campus-jd-skill.zip`](skill/campus-jd-skill.zip)。
2. WorkBuddy：技能 → 添加技能 → 上传技能，选这个 zip（也可以把 `skill/SKILL.md` 内容直接贴给助手）。
3. 直接问，比如：
   - “字节跳动上海的 AI 产品实习有哪些？”
   - “北京的运营校招，帮我挑 5 个适合文科生的”
   - “这周新增了哪些岗位？”
   - “这是我的简历，对照第 2 个岗位帮我改”
4. 标「⚠️链接待核」的投递链接没通过自动校验，打不开就到公司官网搜岗位名。

不用 AI 也可以直接浏览：打开 Pages 首页的 `llms.txt`，或在仓库里看 [`site/`](site/)。

## 数据结构
```
data/<ISO周>/<company>.json   原始抓取数据（schema: data/schema.json，说明: data/SCHEMA.md）
data/state.json               每个岗位 id 的 first_seen / last_seen / status（下架只标 removed，不删）
data/link_status.json         投递链接校验结果
site/llms.txt                 总目录（约 2KB）：枚举、路径模板、各公司计数
site/index.json               全部文件清单与计数
site/slices/{company}/{campus|intern}/{category}/{city}.md   主切片，超 8KB 分页 -p2…
site/by-city/{city}/{campus|intern}-{category}.md            跨公司按城市
site/changes/{week}.md        本周新增/下架
site/jobs/{company}-{postId}.md   岗位详情（job_type、status、要求、投递链接）
site/companies/{company}.md 公司总览；site/by-year/{yy}/ 按届别
skill/SKILL.md + campus-jd-skill.zip   给 agent 的 skill（<BASE_URL> 占位，主 Pages，备 jsDelivr）
```
slug：category `ai-product|product|ops|business|marketing|sales|design|corporate|pm|analysis|planning|supply|other`（排除法：技术岗以外全收，规则见 scripts/reference/CLASSIFIER.md）；城市为拼音（`beijing`、`shanghai`…，未登记城市归 `other`）。

## 维护者
```bash
node scripts/fetchers/bytedance.js          # 单家抓取 → data/<本周>/bytedance.json（Node 18+，无依赖）
for f in scripts/fetchers/*.js; do node $f; done
node scripts/check_links.js                 # 链接校验：先用官网按 id 查详情接口（除滴滴外 18 家；B站限并发 2，华为需浏览器 UA；滴滴列表接口加密，统一记链接待核；网易日常实习 402「职位失效」判下架、通用 500 记待核；vivo Status 2 判疑似下架、500「参数错误」记待核），接口异常时退回格式/HTTP 校验；--probe 每家用真/假 id 验判断逻辑
node scripts/lib/check_links_browser.js --sample 5 --fake   # 可选：Playwright 浏览器兜底（npm i playwright；加 --write 写回）
node scripts/build.js                       # 生成 site/，并校验：文件 ≤8KB、id 唯一、切片计数一致；不通过退出码 1
```
- 新增公司：写 `scripts/fetchers/<slug>.js`（参考现有文件，调用 `run(slug, async () => jobs)`），在 `scripts/lib/site.js` 的 `COMPANY` 加中文名。build 会自动发现 `data/` 下的新文件。
- fetcher 抓到 0 条或比旧文件少一半以上会拒绝覆盖（`--force` 跳过）。
- **拼多多是手动来源**（`source: manual-browser`）：官网接口要 anti_content 风控令牌，写不了抓取器，也没有逐条校验，链接统一「链接待核」，`requirements` 可为 null。站点公司总览、切片和 llms.txt 标「手动更新 · 最后更新 YYYY-MM-DD」，超过 14 天加过期警告。
  - 每周怎么更新：用浏览器按正常访客打开 careers.pddglobalhr.com 应届生/实习列表，按 `data/schema.json` 抄成 `staging/<周>/pinduoduo.json`（`source` 写 `manual-browser`、`link_status` 写「链接待核」、`fetched_at` 写抄录时间），核对分类和城市（省级写「广东省」、全国多地写「全国多地」，原文放 `city_note`）后移到 `data/<周>/pinduoduo.json`，再跑 `node scripts/build.js`。
  - 某周没放新文件时，build 自动沿用最近一周的手动文件，岗位保持 active，不会记成下架；要真正下架某条，就在新的手动文件里删掉它。
- 19 家都有 Node 抓取器（`scripts/fetchers/<slug>.js`），weekly.yml 逐个跑 `scripts/fetchers/*.js`，无需 Python。2026-10-27 新增网易（campus.163.com / campus.game.163.com / hr.163.com 三个域名）、滴滴（列表接口 AES-CBC 加密，用 Node 内置 crypto 按 necromancer 解密，同 reference/dd.py）、B站（串行，请求间隔 ≥1.5s）、得物（飞书 website-path 578078）、OPPO、米哈游、携程（id 保留 MJ 前缀，英文城市转中文）、vivo、华为（浏览器 UA）。抓取结果与 data/2026-W44 对比：id 集合一致（网易少 1 条为官网当天下架）。
- 只想试跑不写 data：`node scripts/fetchers/didi.js --out /tmp/x`。
- `scripts/reference/*.py` 是最初的探索脚本，仅供参考。
- 详情接口在 `scripts/check_links.js` 的 `DETAIL`（除滴滴外 18 家已接）：`async (postId, url) => boolean`，返回 true=在招、false=疑似下架，抛带 `pending` 的错误=链接待核。
- `.github/workflows/weekly.yml`：fetch → check_links →（可选）浏览器校验 → build → 打包 skill → commit → tag `w<周>` → 发布 Pages（需要在仓库设置里把 Pages 来源设为 GitHub Actions）。

数据只取自各公司校招官网的公开接口，不抓需要登录的内容；一切以官网为准。
