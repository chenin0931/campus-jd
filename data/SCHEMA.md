# 数据约定

- 原始数据：`data/<ISO周>/<company_slug>.json`，每个文件是岗位数组，由 `scripts/fetchers/<company_slug>.js` 写出；校验见 `data/schema.json`。
- build 自动发现 `data/<最新周>/` 下的任意 `*.json`，新增公司只需加 fetcher 并在 `scripts/lib/site.js` 的 `COMPANY` 里登记中文名（不登记也能用，显示 slug）。

| 字段 | 类型 | 说明 |
|---|---|---|
| company | string | 公司中文名 |
| business_unit | string[]，可选 | 事业群/业务线（阿里=circleNames，腾讯=bgs，字节=标题后缀，蚂蚁=标题中段），缺失视为 [] |
| title | string | 岗位名 |
| category | `AI产品`/`产品`/`运营` | 类别 |
| job_type | `校招`/`实习` | 缺失时按标题含“实习”推断 |
| city | string[] | 城市（build 归一：去“总部/市/县”，映射英文 slug，未登记的归 other） |
| requirements | string | 岗位要求 |
| deadline | `YYYY-MM-DD` 或 null | 未知填 null |
| apply_url | string | 投递链接；postId 从中提取 |
| source_url | string | 来源页 |
| fetched_at | ISO 8601 | 抓取时间 |

## 派生（build 生成，不写回原始数据）
- `id` = `{company_slug}-{postId}`：postId 取 URL 中的 UUID，否则最后一段 ≥3 位数字，否则最后一个路径/参数 token。全库唯一，build 校验。
- `data/state.json`：`jobs[id] = { first_seen, last_seen, last_week, status: active|removed, removed_at }`。下架只改 status，不删除；`site/jobs/{id}.md` 保留并标 `status: removed`。
- `data/link_status.json`：`scripts/check_links.js` 写入，`{ id: { status: ok|unverified, code, checked_at } }`。unverified 的原因：`hash-route`（前端 # 路由，服务端无法判断）、`spa-shell`（换成不存在的 id 返回同样页面）、HTTP ≥400 或超时。切片里显示「⚠️链接待核」。
- 新增 = 本周有、上周没有（按 id）；首个数据周为基线，不算新增。

## 届别与实习时长（build 派生，不写回 data）
- `project`（抓取字段，可选）：官网结构化招聘项目名，目前字节、小米（飞书招聘 job_subject）提供。
- `grad_year`：整数数组。先从 `project` 取「20XX届」，否则用正则扫标题+要求：「2027届」「27届」「2026年10月1日至2027年9月30日期间毕业」（取结束年）「2027年毕业」；「2028届及以后」→ [2028, 2029]。抽不到为 null。
- `intern_duration`：仅实习岗，如「≥3个月，每周≥4天」，抽不到为 null。实现见 `scripts/lib/extract.js`。
