# WorkBuddy skill 与学生教程验收（零代码学生视角）

审阅对象：本地 76064324 的 skill/SKILL.md、skill/campus-jd-skill.zip、README「使用教程（学生）」、docs/e2e-test.md。只读审阅，没有改仓库文件，也没有提交。时间：2026-10-27（北京时间）。

## 结论
- 我这边没能实机安装 WorkBuddy。官网 workbuddy.cn 提供 Mac、Windows 和鸿蒙电脑版的下载；Linux 只写了「请到系统应用商店下载」，没有给安装包，box 上也没有对应的应用商店（比如 UOS/deepin）。另外使用 WorkBuddy 需要登录账号，按规定我不登录、不注册。所以上传 zip 这一步没有实测。
- zip 的结构符合官方文档：zip 里是 `campus-jd/SKILL.md`，一个技能一个目录，目录里有 SKILL.md，frontmatter 里的 name 和 description 都合法。官方要求上传 zip 时不解压。**但 zip 已经过期**，比仓库里的 SKILL.md 少了一行（见 P1）。
- 教程对不懂代码的学生来说太简略，而且 skill 里的数据地址还是占位符。这一版**不能直接发给学生**。

## 问题清单（按严重程度）

### P0：不改的话 skill 完全用不了
1. **数据地址是占位符**。位置：SKILL.md「地址」一节，`https://<OWNER>.github.io/<REPO>/` 和 jsDelivr 备用地址都是这样。weekly.yml 打包时只是原样复制 SKILL.md，并不会替换占位符。按现在的样子推上去，助手每次都会去拉一个不存在的地址。
   修改建议：推送前先确定 owner/repo，把真实地址直接写进 SKILL.md；或者在 weekly.yml 打包那一步用 sed 替换，再重新打包 zip。
2. **zip 下载链接是仓库内的相对路径**。位置：README 第 1 步 `[skill/campus-jd-skill.zip](skill/campus-jd-skill.zip)`。在 GitHub 网页上点这个链接，打开的是文件预览页，学生得再找下载按钮（Download raw / 「…」菜单）才能下载，很多人会卡在这里。
   修改建议：换成可以直接下载的地址，比如 `https://github.com/<OWNER>/<REPO>/raw/main/skill/campus-jd-skill.zip`，或者 Releases 附件、Pages 上的直链。再补一句「下载后不要解压」。

### P1：大概率会卡住，或者装上的是旧版
3. **zip 和 SKILL.md 内容不一致**。zip 里缺「所属方向通用要求」那一行（腾讯子岗位说明），diff 只有这 1 行不同。
   修改建议：重新打包；在 build 或 CI 里加一步校验，确认 zip 内容和 skill/SKILL.md 逐字节一致。
4. **教程没给 WorkBuddy 的下载地址，也没写安装和登录**。位置：README 第 2 步。
   修改建议：补上官网链接 https://www.workbuddy.cn/ ，写明支持 Mac、Windows、鸿蒙电脑版，Linux 去系统应用商店下载；写明需要先注册或登录（用什么账号登录，请运营确认）。
5. **按钮路径不完整**。教程写的是「技能 → 添加技能 → 上传技能」。官方文档里入口在左侧栏「专家·技能·连接器」下的「技能」页签，之后是「添加技能 > 上传技能」，拖拽或点「选择文件」。学生找不到「技能」在哪。
   修改建议：按官方的叫法写全路径，补一句「不同版本的名字可能略有不同」。
6. **上传之后的环节没写**。官方说上传后会做一次安全检测，高风险的需要手动确认；装好之后学生要不要新建对话、要不要手动选或勾选这个技能、怎么确认它真的生效了，教程都没提。
   修改建议：补「出现安全检测就点继续」「装好后新建一个对话」「如果技能列表里没有，就刷新或重启 WorkBuddy」，再给一句测试问法，比如「你有哪些大厂的校招 JD？」，用来确认技能已经生效。
7. **一张截图都没有**。下载、技能页入口、上传、安全检测、对话这 5 步，每步至少要有 1 张图。目前没法实机截图（见「结论」），需要能在 Mac 或 Windows 上登录 WorkBuddy 的人来补。

### P2：措辞和术语问题
8. 「也可以把 `skill/SKILL.md` 内容直接贴给助手」：学生不知道去哪里找这个文件，也不知道怎么复制原文。建议删掉，或者给出 raw 链接，并说明「全选复制后粘贴到对话里」。
9. 「Pages 首页的 `llms.txt`」「仓库里的 `site/`」：Pages、llms.txt、仓库对学生都是术语。建议直接给出完整网址，写成「不想用 AI 的话，打开这个网址就能看岗位目录」。
10. 「⚠️链接待核」「自动校验」：改成大白话，比如「这个链接我们没能自动确认能打开，打不开就去公司校招官网搜岗位名」。
11. 少一个「常见问题」小节。建议包括：上传失败怎么办（重新下载、不要解压，并附上报错截图）；助手说打不开数据地址怎么办（等几分钟，或者告诉它用备用地址）；数据多久更新一次（每周一）；公司没收录怎么办。
12. 第 3 步的示例问题没先提醒学生说清届别、校招还是实习、城市。SKILL 第 0 步会追问，但学生事先不知道。建议在示例前加一句「最好一次说清：哪一届、校招还是实习、哪个城市」，示例也改成带上这三项的完整句子。

### P3：SKILL.md 内容
13. description 写的是「19 家」，并且没有拼多多。但库里还有拼多多，文中也提到了。按项目汇总，库里是 61 家（含全网/初创数据）。另外 e2e 第二轮场景 e 里写的是「拼多多 404、库里未收录」，和现在的数据已经对不上了。建议把公司数和名单改成和 llms.txt 一致，或者改成「60+ 家，以 llms.txt 为准」，并重跑场景 e。
14. e2e-test.md 用的数据是 10 家、2560 条，是老数据，而且自己也写了「没在 WorkBuddy 真机验证」。建议推送后在 WorkBuddy 真机上按当前数据（7254 条）重跑。

## skill 依赖的 URL（推送前预计 404）
相对 `<BASE_URL>`（主地址 `https://<OWNER>.github.io/<REPO>/`，备用地址 `https://cdn.jsdelivr.net/gh/<OWNER>/<REPO>@main/site/`）：
- `llms.txt`
- `index.json`
- `companies/{company}.md`
- `slices/{company}/{campus|intern}/{category}/{city}.md`（含分页 `-p2…`）
- `by-city/{city}/{campus|intern}-{category}.md`
- `by-year/{yy}/{campus|intern}-{category}.md`
- `changes/{week}.md`
- `jobs/{id}.md`
- 另外 README 里还依赖 zip 的下载地址（GitHub 上的地址）。
注意：jsDelivr 备用地址要求仓库是公开的。Pages 需要在仓库设置里把来源设为 GitHub Actions。
