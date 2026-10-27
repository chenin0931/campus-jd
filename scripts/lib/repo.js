// 仓库地址占位符：源文件里统一写 <OWNER>/<REPO>（唯一占位形式），由 scripts/set_repo.js 或打包时按 OWNER/REPO 替换。
const PLACEHOLDER_FILES = ['skill/SKILL.md', 'README.md'];
const parseRepo = s => { const m = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/.exec(String(s || '').trim()); return m ? { owner: m[1], repo: m[2] } : null; };
const fillRepo = (text, r) => r ? text.replace(/<OWNER>/g, r.owner).replace(/<REPO>/g, r.repo) : text;
const hasPlaceholder = text => /<OWNER>|<REPO>/.test(text);
module.exports = { PLACEHOLDER_FILES, parseRepo, fillRepo, hasPlaceholder };
