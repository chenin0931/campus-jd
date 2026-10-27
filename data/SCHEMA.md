# 数据约定

- 路径：`data/<ISO周>/<company>.json`，如 `data/2026-W44/bytedance.json`
- 每个文件是岗位数组，校验用 `data/schema.json`

| 字段 | 类型 | 说明 |
|---|---|---|
| company | string | 公司标识，小写，如 bytedance |
| title | string | 岗位名 |
| category | `AI产品`/`产品`/`运营` | 类别 |
| city | string[] | 城市 |
| requirements | string | 岗位要求摘要 |
| deadline | `YYYY-MM-DD` 或 null | 截止日期，未知填 null |
| apply_url | string | 投递链接（新增判定主键） |
| source_url | string | 数据来源页 |
| fetched_at | ISO 8601 | 抓取时间 |
| job_type | `校招`/`实习`，可选 | 也兼容读取 `type`。缺失时 build 按 title 含“实习”推断，否则为“校招”，输出带 `job_type_inferred: true` |
| example | boolean，可选 | 示例/假数据标记，为 true 时 README 中会标注 |

新增判定：本周有、上周没有（按 apply_url；缺失时按 company+title）。
只收录官网公开岗位，不抓需要登录的数据。

## build 派生字段（只出现在 jobs/latest.json，不写回 data/）
- `company_slug`：文件名，如 bytedance（分表路径用）
- `first_seen`：首次出现日期，跨周保存在 `data/state.json`
- `is_new`：上一周没有
- `removed[]`：上一周有、本周没有的岗位，`status: "已下架"`
- 同一 apply_url 在一周内重复时只保留第一条
