# requirements 补抓（2026-W44）

只补 `requirements` 字段，不改分类、不改任何现有数据文件。生成脚本：`backfill.js`（node，只读，约 1 req/s）。

## 来源
- 腾讯：官方 `https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?postId=<postid>`。缺描述的 70 条全是「青云课题」，描述放在 `topicDetail`/`topicRequirement`，不在 fetcher 读的 `desc`/`request` 里。合并后的文本带「课题背景/课题要求」小标题。
- Moka（知乎/Shopee/微博/驭势/壁仞）：Moka 页面自己调用的公开接口 `POST https://app.mokahr.com/api/outer/ats-apply/website/job`，body `{orgId, siteId, jobId}`。返回体用和列表接口相同的 necromancer 解密，取 `jobDescription`，再去掉 HTML 标签。

## 文件格式
`<company>.json`：`{company, source_file, total, had_desc_before, backfilled, patch: {<id>: {requirements, source_url, fetched_at}}, failures: [...]}`
- 腾讯的 key 是 apply_url 里的 postid；Moka 的 key 是 job 的 `id` 字段。

## 合并（由全栈开发者入库）
对 source_file 里每条 `requirements` 去掉首尾空白后少于 20 字的岗位，用 key 查 patch，找到了就把 `requirements` 换成补抓的文本。其他字段（包括 category）一律不动。合并完照常跑测试和 build。
