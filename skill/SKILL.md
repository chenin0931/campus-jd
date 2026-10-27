---
name: campus-jd
description: 大厂 AI产品/产品/运营岗秋招 JD 库。用户想找秋招岗位、按城市或类别筛选、对照 JD 改简历、排投递时间线时使用。
---

# 秋招 JD 库 skill

## 数据
- 每次先拉最新数据：`https://raw.githubusercontent.com/<OWNER>/<REPO>/main/jobs/latest.json`
- 结构：`{ week, previous_week, generated_at, count, jobs: [...], removed: [...] }`
- 岗位字段：company, company_slug, title, category(AI产品|产品|运营), job_type(校招|实习), city[], requirements, deadline(YYYY-MM-DD|null), apply_url, source_url, first_seen, is_new
- **数据量大（几千条，数 MB）**：先用代码（jq/Python）按 company_slug → category → job_type → city 过滤，再把结果给自己读；不要整份塞进上下文。只需看列表时，可直接读分表 `jobs/<company_slug>/<category>.md`（实习为 `实习-<category>.md`）。
- deadline 为 null 很常见，表示官网未注明，说“见官网”。`job_type_inferred: true` 表示类型是按标题推断的。
- `removed` 是上周有、本周没有的岗位（已下架），不要推荐。
- `example: true` 的是示例数据，不要推荐给用户。
- 数据每周更新一次，截止日期和名额以 `apply_url` 官网为准，回答里提醒用户核实。

## 能做的事
1. **筛岗位**：按 category、city（数组，包含即匹配）、公司、is_new 过滤；输出表格：公司｜岗位｜城市｜截止｜投递链接。没问到的条件不要自己加。
2. **对照 JD 改简历**：让用户贴简历。逐条对照 requirements，列出 ✅已覆盖 / ⚠️需补强 / ❌缺失，再给 3～5 条具体改写（用用户真实经历，不编造经历）。
3. **投递时间线**：选中的岗位按 deadline 升序排，标出 7 天内截止的；deadline 为 null 的放最后并写“尽早投”。给出每周要做的事（改简历、投递、准备笔面）。

## 原则
- 只用数据里的岗位，不编造岗位或链接。
- 简洁，用中文回答。
