# 腾讯「项目实习生」汇总入口子岗位（2026-W44）

来源：join.qq.com 官方公开接口 `api/v1/jobDetails/getJobDetailsByPostId`（汇总入口 postId -2…-6 的 `projectInternDirections`，再逐个子岗位 postId 取详情）。无登录，约 1 次/秒，无失败。抓取时间 2026-10-27 18:5x（UTC+8）。未分类、未合并。

| 入口 | 子岗位 |
|---|---|
| 产品 | 游戏运营、内容创作、产品策划、产品运营（4） |
| 设计 | 动画、视觉设计（2） |
| 市场 | 商业分析、市场营销（2） |
| 职能 | 人力资源、公共事务（2） |
| 技术（仅列名，technical_entry=true，不收） | 全栈开发、应用运维安全（2） |

- 总计 12 条，非技术 10 条
- 新增 10 条，与现有 tencent.json 重复 0 条（按 postId 和规范化岗位名都对过）
- 海外 0 条（overseas 字段都是 false，地点都在深圳、北京、上海、广州、成都）
- 招聘类型都是「日常实习」
- 注意：子岗位官方详情的 desc 和 request 都是「无」。要求文字在所属入口的 `entry_requirements` 里，入库时是否沿用由全栈开发者定。
