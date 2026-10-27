#!/usr/bin/env node
// 打包 skill/campus-jd-skill.zip（内含 campus-jd/SKILL.md），build.js 末尾自动调用，保证 zip 不会过期。
// 若设置了 GITHUB_REPOSITORY（或传 OWNER/REPO），zip 里的 SKILL.md 先替换 <OWNER>/<REPO>；否则原样打包并警告。
// 输出确定性：固定文件时间，内容不变则 zip 字节不变。--check：只校验 zip 内容与（替换后的）SKILL.md 一致，不一致退出码 1。
const fs = require('fs'), path = require('path'), zlib = require('zlib'), { parseRepo, fillRepo, hasPlaceholder } = require('./lib/repo');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'skill', 'SKILL.md'), OUT = path.join(ROOT, 'skill', 'campus-jd-skill.zip'), NAME = 'campus-jd/SKILL.md';
function zip(name, data) { // 单文件 deflate zip
  const n = Buffer.from(name, 'utf8'), c = zlib.deflateRawSync(data, { level: 9 }), crc = zlib.crc32(data), T = 0, D = (2026 - 1980) << 9 | 1 << 5 | 1;
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(T, 10); lh.writeUInt16LE(D, 12);
  lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(c.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(n.length, 26);
  const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(T, 12); ch.writeUInt16LE(D, 14);
  ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(c.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(0o100644 << 16 >>> 0, 38);
  const off = 30 + n.length + c.length, cd = 46 + n.length, e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(1, 8); e.writeUInt16LE(1, 10); e.writeUInt32LE(cd, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([lh, n, c, ch, n, e]);
}
function unzip1(buf) { const nl = buf.readUInt16LE(26), xl = buf.readUInt16LE(28), cs = buf.readUInt32LE(18), m = buf.readUInt16LE(8), s = buf.subarray(30 + nl + xl, 30 + nl + xl + cs);
  return { name: buf.subarray(30, 30 + nl).toString('utf8'), data: m === 8 ? zlib.inflateRawSync(s) : s }; }
function expected(repoArg) { const r = parseRepo(repoArg || process.env.GITHUB_REPOSITORY); return { r, data: Buffer.from(fillRepo(fs.readFileSync(SRC, 'utf8'), r), 'utf8') }; }
function pack(repoArg) { const { r, data } = expected(repoArg); fs.writeFileSync(OUT, zip(NAME, data));
  if (hasPlaceholder(data.toString())) console.warn('⚠️ skill zip 里的地址仍是 <OWNER>/<REPO> 占位符（未设置 GITHUB_REPOSITORY，也没跑 scripts/set_repo.js）');
  console.log(`skill 已打包 ${path.relative(ROOT, OUT)}（${data.length}B${r ? `，仓库 ${r.owner}/${r.repo}` : ''}）`); }
function check(repoArg) { const { data } = expected(repoArg), z = unzip1(fs.readFileSync(OUT)); return z.name === NAME && z.data.equals(data); }
module.exports = { pack, check };
if (require.main === module) { const a = process.argv.slice(2), repo = a.find(x => x.includes('/'));
  if (a.includes('--check')) { const ok = check(repo); console.log(ok ? 'zip 与 SKILL.md 一致' : '❌ zip 与 SKILL.md 不一致，请运行 node scripts/package_skill.js'); process.exit(ok ? 0 : 1); }
  pack(repo); }
