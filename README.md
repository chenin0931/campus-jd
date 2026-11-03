# 大厂、互联网公司和 AI 初创的校招与实习非技术岗 JD 库（产品/运营/商务/市场/销售/设计/职能/项目管理/分析/策划/供应链，每周更新）

收录大厂、互联网公司和 AI 初创官网公开的校招与实习非技术岗。GitHub Actions 每周一自动抓取大厂、全网和 AI 初创官网的公开岗位（个别只能人工录入的公司沿用最近一次录入，标抓取日期），在服务端算好按**公司 × 校招/实习 × 类别 × 城市**切分的小文件（每个 ≤8KB），发布到 GitHub Pages。学生的 AI 助手（WorkBuddy 等）装上 skill 后，只需 fetch 两三个小文件就能回答“上海有哪些 AI 产品实习”。

## 总览
<!-- overview:start -->
数据周 **2026-W44**（2026-11-03 生成）· 在招 **9251** · 本周新增 **0** · 下架 **0**

| 公司 | 校招 | 实习 | 合计 |
|---|---:|---:|---:|
| 零一万物 | 0 | 7 | 7 |
| 360 | 7 | 36 | 43 |
| 智元机器人 | 57 | 3 | 60 |
| 智平方 | 0 | 1 | 1 |
| 爱诗科技 | 0 | 2 | 2 |
| 阿里巴巴 | 116 | 0 | 116 |
| 蚂蚁集团 | 19 | 29 | 48 |
| 星尘智能 | 6 | 0 | 6 |
| 百度 | 61 | 307 | 368 |
| 哔哩哔哩 | 35 | 242 | 277 |
| 壁仞科技 | 5 | 0 | 5 |
| 字节跳动 | 859 | 2201 | 3060 |
| 携程 | 37 | 22 | 59 |
| 得物 | 133 | 5 | 138 |
| 原力灵机 | 1 | 4 | 5 |
| 滴滴 | 43 | 455 | 498 |
| 飞象星球 | 0 | 1 | 1 |
| 非夕科技 | 0 | 1 | 1 |
| 星海图 | 0 | 1 | 1 |
| 银河通用 | 2 | 2 | 4 |
| 荣耀 | 15 | 0 | 15 |
| 华为 | 21 | 11 | 32 |
| 科大讯飞 | 48 | 0 | 48 |
| 爱奇艺 | 0 | 96 | 96 |
| 京东 | 88 | 77 | 165 |
| 贝壳 | 17 | 20 | 37 |
| 快手 | 169 | 76 | 245 |
| 联想 | 36 | 0 | 36 |
| 光轮智能 | 0 | 5 | 5 |
| 逐际动力 | 0 | 2 | 2 |
| 理想汽车 | 147 | 262 | 409 |
| 流形空间 | 0 | 2 | 2 |
| Manus | 0 | 3 | 3 |
| 美团 | 73 | 197 | 270 |
| 米哈游 | 74 | 84 | 158 |
| MiniMax | 5 | 26 | 31 |
| 面壁智能 | 0 | 22 | 22 |
| 月之暗面 | 0 | 55 | 55 |
| 网易 | 86 | 529 | 615 |
| 蔚来 | 145 | 348 | 493 |
| OPPO | 45 | 31 | 76 |
| 拼多多 | 27 | 2 | 29 |
| 商汤科技 | 12 | 22 | 34 |
| 生数科技 | 0 | 16 | 16 |
| Shopee | 21 | 0 | 21 |
| 千寻智能 | 7 | 10 | 17 |
| 阶跃星辰 | 19 | 16 | 35 |
| 腾讯 | 71 | 183 | 254 |
| 特赞 | 0 | 5 | 5 |
| 腾讯音乐 | 25 | 73 | 98 |
| 驭势科技 | 3 | 2 | 5 |
| vivo | 10 | 27 | 37 |
| 新浪/微博 | 7 | 0 | 7 |
| 自变量机器人 | 0 | 19 | 19 |
| 小红书 | 34 | 183 | 217 |
| 小米 | 316 | 291 | 607 |
| 小鹏汽车 | 235 | 63 | 298 |
| 与爱为舞 | 8 | 2 | 10 |
| 知乎 | 11 | 16 | 27 |
<!-- overview:end -->

## 使用教程（学生，不需要会写代码）

这个库能做什么：把它装进 AI 助手 WorkBuddy 以后，你用中文直接问「上海有哪些运营实习」，助手就会从这里查各大厂官网上的真实岗位，给你列表格、贴投递链接，还能对照岗位要求帮你改简历。数据每周一更新。

### 第 1 步：下载技能包（一个 zip 文件）
- 点这里直接下载：**[campus-jd-skill.zip](https://github.com/<OWNER>/<REPO>/releases/latest/download/campus-jd-skill.zip)**
- ⚠️ **下载后不要解压**，也不要改文件名，后面要把这个 zip 原样上传。
- 有的电脑（比如 Mac 的 Safari）会自动解压，变成一个叫 `campus-jd` 的文件夹。遇到这种情况，请换 Chrome/Edge 重新下载，或者在浏览器设置里关掉「下载后自动打开」。

> 【截图占位 1：浏览器下载完成后看到的 campus-jd-skill.zip】

### 第 2 步：安装 WorkBuddy 并登录
- 官网下载：<https://www.workbuddy.cn/>，有 **Mac、Windows、鸿蒙电脑版**（Linux 电脑请到系统自带的应用商店里搜索 WorkBuddy）。
- 安装后打开，**需要先登录账号才能用**（按软件里的提示注册或登录）。

> 【截图占位 2：WorkBuddy 官网下载页 / 登录界面】

### 第 3 步：上传技能
1. 在 WorkBuddy 左侧栏点 **「专家·技能·连接器」**，再点上方的 **「技能」**。
2. 点 **「添加技能」→「上传技能」**，把第 1 步下载的 `campus-jd-skill.zip` 拖进去，或者点「选择文件」选中它。
3. 上传后 WorkBuddy 会做一次**安全检测**。如果提示需要确认，点继续或确认安装即可（这个技能只会读取公开的岗位网页，不碰你的电脑文件）。
4. 装好后，技能列表里会出现 **campus-jd**。如果没看到，刷新一下页面，或者关掉 WorkBuddy 重新打开。

不同版本 WorkBuddy 的按钮名字可能略有不同，找意思相近的就行。

> 【截图占位 3：左侧栏「专家·技能·连接器」→「技能」页签】
> 【截图占位 4：「添加技能 → 上传技能」对话框】
> 【截图占位 5：安全检测提示 / 安装成功后技能列表里的 campus-jd】

### 第 4 步：新建对话，确认技能生效
1. **新建一个对话**（旧对话可能还没加载新技能）。
2. 先问一句测试：「**你有哪些大厂的校招 JD？**」
3. 生效的样子：助手会说它在读这个 JD 库，回答里有公司名单和岗位数量（约 60 家公司：大厂、全网、AI 初创三组，九千多个岗位），并且会反过来问你是哪一届、找校招还是实习、在哪个城市。
4. 没生效的样子：助手泛泛地说「建议你去各公司官网看看」，或者编了一些没有链接的岗位。这时请看下面的「常见问题」。

> 【截图占位 6：测试提问后助手的正确回答】

### 第 5 步：开始问（最好一次说清三件事）
**哪一届**（哪年毕业）、**校招还是实习**、**哪个城市**。说清了，助手就不用来回追问。例如：
- 「我是 2027 届，找**上海**的 **AI 产品实习**，字节跳动有哪些？」
- 「2027 届文科生，想找**北京**的**运营校招**，帮我挑 5 个不要求会写代码的。」
- 「2028 届，**杭州或上海**的**市场实习**，每周能去 4 天，能实习 3 个月。」
- 「这周新增了哪些岗位？」（可以不说届别）
- 「这是我的简历（粘贴进来），对照你刚才推荐的第 2 个岗位帮我改。」

### 回答里的标记是什么意思
- **⚠️链接待核**：这个投递链接我们没能自动确认能不能打开。如果打不开，就去这家公司的校招官网，搜索岗位名称。
- **❌疑似下架**：公司官网已经查不到这个岗位，大概率招满或关闭了。
- **🌏海外**：工作地点在海外（港澳台算国内）。
- **🆕**：本周新增的岗位。
- **抓取日期**：每个岗位都写了我们最近一次在官网看到它的日期（列表里的「抓取」一列，详情里的「最近抓取」）。
- **⏳可能已下架**：这条岗位超过 14 天没在官网重新看到（某家官网那周抓取失败、或是手动录入的公司，会沿用旧数据），可能已经关了。投递前先去官网确认，这种岗位也不会标 🆕。
- 截止日期大多数公司没写，一律以官网为准，建议尽早投。

### 常见问题
- **上传失败 / 提示格式不对**：多半是 zip 被解压过或下载不完整。重新点第 1 步的链接下载，**不要解压**，再上传。还不行就截图报错信息发给运营同学。
- **助手说打不开数据地址**：等几分钟再问一次；或者直接对它说「主地址打不开，请用备用地址」（技能里写了备用地址）。
- **数据多久更新一次**：每周一自动更新。新技能包不用重新下载，助手每次都会读取最新数据；只有技能本身改版时我们才会通知大家重新下载。
- **我想找的公司没有**：说明这个库暂时没收录，请直接去该公司校招官网。助手也会如实告诉你没有，不会拿别的公司凑数。
- **助手推荐的岗位和官网对不上**：以官网为准。可以把岗位名称和链接发给运营同学，我们核实后修正。

### 不想用 AI，也能直接看
用浏览器打开这个网址，就是全部岗位的目录（纯文字页面，按公司、城市、类别分好了）：[https://<OWNER>.github.io/<REPO>/llms.txt](https://<OWNER>.github.io/<REPO>/llms.txt)

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
skill/SKILL.md + campus-jd-skill.zip   给 agent 的 skill（主 Pages，备 jsDelivr；仓库地址占位见下方「维护者」）
```
slug：category `ai-product|product|ops|business|marketing|sales|design|corporate|pm|analysis|planning|supply|other`（排除法：技术岗以外全收，规则见 scripts/reference/CLASSIFIER.md）；城市为拼音（`beijing`、`shanghai`…，未登记城市归 `other`）。

## 维护者
```bash
node scripts/fetchers/bytedance.js          # 单家抓取 → data/<本周>/bytedance.json（Node 18+，无依赖）
for f in scripts/fetchers/*.js; do node $f; done   # 大厂
node scripts/fetch_datasets.js                      # 全网 + 初创（须在大厂之后）
node scripts/check_links.js                 # 链接校验：先用官网按 id 查详情接口（除滴滴外 18 家；B站限并发 2，华为需浏览器 UA；滴滴列表接口加密，统一记链接待核；网易日常实习 402「职位失效」判下架、通用 500 记待核；vivo Status 2 判疑似下架、500「参数错误」记待核），接口异常时退回格式/HTTP 校验；--probe 每家用真/假 id 验判断逻辑
node scripts/lib/check_links_browser.js --sample 5 --fake   # 可选：Playwright 浏览器兜底（npm i playwright；加 --write 写回）
node scripts/build.js                       # 生成 site/ 并打包 skill/campus-jd-skill.zip，校验：文件 ≤8KB、id 唯一、切片计数一致、zip 与 SKILL.md 一致；不通过退出码 1
node scripts/set_repo.js OWNER/REPO         # 把 SKILL.md、README 里尖括号写法的 OWNER/REPO 占位符换成真实仓库（CI 用 GITHUB_REPOSITORY 自动做）
node scripts/package_skill.js --check       # 只校验 zip 是否与 SKILL.md 一致
```
- 新增公司：写 `scripts/fetchers/<slug>.js`（参考现有文件，调用 `run(slug, async () => jobs)`），在 `scripts/lib/site.js` 的 `COMPANY` 加中文名。build 会自动发现 `data/` 下的新文件。
- fetcher 抓到 0 条或比旧文件少一半以上会拒绝覆盖（`--force` 跳过）。
- **拼多多是手动来源**（`source: manual-browser`）：官网接口要 anti_content 风控令牌，写不了抓取器，也不能自动校验；每次浏览器人工逐条核对后在 `data/link_status.json` 记 `code: manual-browser-verified` 和 `verified_at`，14 天内显示为已核对，超期自动回到「链接待核」，`requirements` 可为 null。站点公司总览、切片和 llms.txt 标「手动更新 · 最后更新 YYYY-MM-DD」，超过 14 天加过期警告。
  - 每周怎么更新：用浏览器按正常访客打开 careers.pddglobalhr.com 应届生/实习列表，按 `data/schema.json` 抄成 `staging/<周>/pinduoduo.json`（`source` 写 `manual-browser`、`link_status` 写「链接待核」、`fetched_at` 写抄录时间），核对分类和城市（省级写「广东省」、全国多地写「全国多地」，原文放 `city_note`）后移到 `data/<周>/pinduoduo.json`，再跑 `node scripts/build.js`。
  - 某周没放新文件时，build 自动沿用最近一周的手动文件，岗位保持 active，不会记成下架；要真正下架某条，就在新的手动文件里删掉它。
- 全网 15 家（含从初创挪来的微博、Shopee、知乎）+ AI 初创 24 家由 `scripts/fetch_datasets.js` 每周抓取（配置：`scripts/datasets.json` + `scripts/startups.json`；飞书/Moka 用 `fetchers/lib/{feishu,moka}.js`，北森 zhiye、荣耀、腾讯音乐、理想、联想、Manus、京东全网增量见 `fetchers/lib/others.js`），后处理与 `merge_staging.js` 相同（`classifyJob` 重算、社招只留实习、标 region、与本周大厂去重、`dataset` 字段区分 大厂/全网/初创，大厂同公司增量写 `<slug>@全网.json`）。必须在大厂抓取器之后跑。单家失败（接口报错、0 条或少于上一份 50%）不写文件，build 沿用最近一周的文件、`fetched_at` 保持上次成功抓取的日期，超过 14 天（`node scripts/build.js --today YYYY-MM-DD` 可模拟）标 ⏳可能已下架、不算新增。只能人工录入的：星海图（galaxea，`manual-browser`）、拼多多（大厂 `pinduoduo.json`，`manual-browser`），要每两周内重新录入一次，否则会变成 ⏳可能已下架。链接未核的标 ⚠️链接待核；`link_check` 按 id 沿用上一份。人工核验结果按 `staging/<周>/link_check_format.md` 交到 `staging/<周>/link_check/`，`node scripts/import_link_check.js` 读进 `data/link_status.json`（ok/fixed→已核验，fixed 用 new_url 替换链接；not_found→❌疑似下架；unverifiable→待核；都 14 天有效）。
- 大厂 19 家都有 Node 抓取器（`scripts/fetchers/<slug>.js`），weekly.yml 逐个跑 `scripts/fetchers/*.js`，无需 Python。2026-10-27 新增网易（campus.163.com / campus.game.163.com / hr.163.com 三个域名）、滴滴（列表接口 AES-CBC 加密，用 Node 内置 crypto 按 necromancer 解密，同 reference/dd.py）、B站（串行，请求间隔 ≥1.5s）、得物（飞书 website-path 578078）、OPPO、米哈游、携程（id 保留 MJ 前缀，英文城市转中文）、vivo、华为（浏览器 UA）。抓取结果与 data/2026-W44 对比：id 集合一致（网易少 1 条为官网当天下架）。
- 只想试跑不写 data：`node scripts/fetchers/didi.js --out /tmp/x`。
- `scripts/reference/*.py` 是最初的探索脚本，仅供参考。
- 详情接口在 `scripts/check_links.js` 的 `DETAIL`（除滴滴外 18 家已接）：`async (postId, url) => boolean`，返回 true=在招、false=疑似下架，抛带 `pending` 的错误=链接待核。
- `.github/workflows/weekly.yml`：fetch → check_links →（可选）浏览器校验 → set_repo 填地址 → build（含打包 skill）→ commit → tag `w<周>` → Release 附上 zip（README 下载链接 `releases/latest/download/campus-jd-skill.zip` 指向它）→ 发布 Pages。
- **仓库地址占位符**：源文件里只用尖括号包住的 OWNER、REPO 一种写法（SKILL.md 的主/备地址、README 的下载和目录链接）。CI 每次构建前自动替换；本地确定仓库名后可跑 `node scripts/set_repo.js OWNER/REPO`。若仓库名本身是 `OWNER.github.io`，Pages 地址没有 `/<REPO>/` 这一段，需要手改。
- 首次推送前请过一遍 [docs/pre-push-checklist.md](docs/pre-push-checklist.md)。

数据只取自各公司校招官网的公开接口，不抓需要登录的内容；一切以官网为准。
