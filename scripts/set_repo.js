#!/usr/bin/env node
// 把源文件里的 <OWNER>/<REPO> 占位符换成真实仓库：node scripts/set_repo.js OWNER/REPO
// 不带参数时读环境变量 GITHUB_REPOSITORY（GitHub Actions 自带）。已替换过的文件不变（幂等）。
const fs = require('fs'), path = require('path'), { PLACEHOLDER_FILES, parseRepo, fillRepo } = require('./lib/repo');
const r = parseRepo(process.argv[2] || process.env.GITHUB_REPOSITORY);
if (!r) { console.error('用法：node scripts/set_repo.js OWNER/REPO（或设置 GITHUB_REPOSITORY）'); process.exit(1); }
for (const f of PLACEHOLDER_FILES) { const p = path.join(__dirname, '..', f), s = fs.readFileSync(p, 'utf8'), t = fillRepo(s, r);
  if (t !== s) fs.writeFileSync(p, t); console.log(t !== s ? '已替换' : '无占位符', f); }
