# 首次推送 GitHub 前检查清单

推送需要 cheney 明确同意。以下每项打勾后再推。

## 仓库设置
- [ ] **仓库必须是公开的（Public）**：jsDelivr 备用地址 `cdn.jsdelivr.net/gh/OWNER/REPO@main/site/` 只能读公开仓库；Release 附件下载链接对私有仓库也要求登录，学生会下载失败。
- [ ] **Settings → Pages → Build and deployment → Source 选「GitHub Actions」**（不是「Deploy from a branch」），否则 weekly.yml 的 deploy-pages 会失败。
- [ ] Settings → Actions → General → Workflow permissions 选「Read and write permissions」（weekly.yml 要提交数据、打 tag、建 Release）。
- [ ] 默认分支名是 `main`（jsDelivr 备用地址写死了 `@main`）。
- [ ] 仓库名不是 `OWNER.github.io`（那种仓库的 Pages 地址没有 `/REPO/` 一段，需要手改 SKILL.md 和 README）。

## 仓库地址
- [ ] 确定 OWNER/REPO 后本地跑 `node scripts/set_repo.js OWNER/REPO`，再跑 `node scripts/build.js`（会重新打包 zip），提交。
      不跑也行：CI 每次构建前用 `GITHUB_REPOSITORY` 自动替换并提交，但第一次 CI 跑完之前 README 链接和 zip 里的地址还是占位符。
- [ ] `rg "<OWNER>|<REPO>" skill/SKILL.md README.md` 没有输出。
- [ ] `node scripts/package_skill.js --check` 显示「zip 与 SKILL.md 一致」。

## 推送后
- [ ] Actions 里手动触发一次 weekly-update（workflow_dispatch），确认 build、Release、Pages 三步都成功。
- [ ] 打开 `https://OWNER.github.io/REPO/llms.txt` 和 `https://cdn.jsdelivr.net/gh/OWNER/REPO@main/site/llms.txt`，都能看到目录。
- [ ] 打开 `https://github.com/OWNER/REPO/releases/latest/download/campus-jd-skill.zip`，能直接下载 zip。
- [ ] 在 WorkBuddy 真机按 README 教程走一遍（上传 → 安全检测 → 新建对话 → 测试问法），补上 README 里的 6 张截图占位。
- [ ] 按 docs/e2e-test.md 的场景在真机上重跑，至少 a、e、f、h。
