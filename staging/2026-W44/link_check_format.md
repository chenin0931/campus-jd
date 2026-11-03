# 链接核验结果格式（初创 / 全网）

沿用拼多多那次（`pdd_link_check/pdd_link_check.json`）的字段，只多两条要求：每条带 `verified_at`，按批落盘。

## 存放
- 目录：`staging/2026-W44/link_check/`
- 每批一个文件，约 50 条：`<数据集>_<序号>.json`，例如 `初创_001.json`、`全网_014.json`
- 写完一批立刻落盘；已落盘的批次不要再改，补核或更正另起一个新批次文件（后面的覆盖前面的）

## 文件结构
```json
{
  "dataset": "初创",
  "batch": 1,
  "method": "官网详情页逐条打开；未登录，未调用反爬接口",
  "summary": {"ok": 0, "fixed": 0, "not_found": 0, "unverifiable": 0},
  "roles": [
    {
      "id": "库里的岗位 id，原样照抄",
      "title": "官网上的岗位名",
      "old_url": "库里原来的链接",
      "status": "ok | fixed | not_found | unverifiable",
      "new_url": "status=fixed 时填官网详情页链接，否则 null",
      "verified_at": "YYYY-MM-DD（北京时间，打开核对的那天）",
      "notes": "标题/城市/届别/类型是否一致；不一致写清哪里不一致"
    }
  ]
}
```

## status 含义
- `ok`：链接能打开，是该岗位详情页，标题、城市、届别/类型一致
- `fixed`：原链接不对（列表页、跳错岗位等），在官网找到了正确详情页，填 `new_url`
- `not_found`：官网上找不到该岗位，或页面写明已结束/已下架 → 库里标「疑似下架」
- `unverifiable`：要登录、打不开、被拦截等，没法确认 → 继续标「链接待核」，`notes` 写原因

## 注意
- 只走各家官网；不登录，不碰反爬接口
- 只记核验结果，不改分类；分类有疑问写进 `notes`
- 发现打不开或已下架的，当批就交，不用等全部核完
- 核验有效期 14 天：`verified_at` 起 14 天内算已核验，之后自动回到「链接待核」
