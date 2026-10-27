# 大厂 AI产品 / 产品 / 运营岗 校招·实习 JD 库（每周更新）

GitHub Actions 每周一自动抓取各大厂校招官网的公开岗位，在服务端算好按**公司 × 校招/实习 × 类别 × 城市**切分的小文件（每个 ≤8KB），发布到 GitHub Pages。学生的 AI 助手（WorkBuddy 等）装上 skill 后，只需 fetch 两三个小文件就能回答“上海有哪些 AI 产品实习”。

## 总览
<!-- overview:start -->
数据周 **2026-W44**（2026-10-27 生成）· 在招 **2709** · 本周新增 **0** · 下架 **0**

| 公司 | 校招 | 实习 | 合计 |
|---|---:|---:|---:|
| 阿里巴巴 | 33 | 0 | 33 |
| 蚂蚁集团 | 5 | 3 | 8 |
| 百度 | 19 | 173 | 192 |
| 字节跳动 | 568 | 1199 | 1767 |
| 滴滴 | 33 | 114 | 147 |
| 京东 | 23 | 21 | 44 |
| 快手 | 84 | 41 | 125 |
| 美团 | 26 | 81 | 107 |
| 网易 | 2 | 0 | 2 |
| 腾讯 | 14 | 21 | 35 |
| 小红书 | 9 | 83 | 92 |
| 小米 | 157 | 0 | 157 |
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
skill/SKILL.md + campus-jd-skill.zip   给 agent 的 skill（<BASE_URL> 占位，主 Pages，备 jsDelivr）
```
slug：category `ai-product|product|operations`；城市为拼音（`beijing`、`shanghai`…，未登记城市归 `other`）。

## 维护者
```bash
node scripts/fetchers/bytedance.js          # 单家抓取 → data/<本周>/bytedance.json（Node 18+，无依赖）
for f in scripts/fetchers/*.js; do node $f; done
node scripts/check_links.js                 # 链接校验：先用官网按 id 查详情接口（腾讯、字节、小米），没有接口的公司做格式/HTTP 校验
node scripts/lib/check_links_browser.js --sample 5 --fake   # 可选：Playwright 浏览器兜底（npm i playwright；加 --write 写回）
node scripts/build.js                       # 生成 site/，并校验：文件 ≤8KB、id 唯一、切片计数一致；不通过退出码 1
```
- 新增公司：写 `scripts/fetchers/<slug>.js`（参考现有文件，调用 `run(slug, async () => jobs)`），在 `scripts/lib/site.js` 的 `COMPANY` 加中文名。build 会自动发现 `data/` 下的新文件。
- fetcher 抓到 0 条或比旧文件少一半以上会拒绝覆盖（`--force` 跳过）。
- `scripts/reference/*.py` 是最初的探索脚本，仅供参考。
- 详情接口插槽在 `scripts/check_links.js` 的 `DETAIL`：快手/京东/美团/小红书/阿里/蚂蚁/百度暂为 null，补一个 `async (postId, url) => boolean` 即可。
- `.github/workflows/weekly.yml`：fetch → check_links →（可选）浏览器校验 → build → 打包 skill → commit → tag `w<周>` → 发布 Pages（需要在仓库设置里把 Pages 来源设为 GitHub Actions）。

数据只取自各公司校招官网的公开接口，不抓需要登录的内容；一切以官网为准。
