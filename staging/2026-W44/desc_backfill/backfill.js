// 只读补抓 requirements：腾讯官方详情接口 + Moka 公开详情接口（页面自身调用的 POST /api/outer/ats-apply/website/job）。约 1 req/s。
const fs=require('fs'),crypto=require('crypto'),P=require('path');
const OUT=__dirname,sleep=ms=>new Promise(r=>setTimeout(r,ms)),UA={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};
const clean=s=>String(s||'').replace(/<br\s*\/?>|<\/p>|<\/li>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim().slice(0,4000);
function decrypt(d){if(!d.necromancer)return d.data;const k=Buffer.from(d.necromancer),dc=crypto.createDecipheriv(`aes-${k.length*8}-cbc`,k,k);dc.setAutoPadding(false);let p=Buffer.concat([dc.update(Buffer.from(d.data,'base64')),dc.final()]);p=p.subarray(0,p.length-p[p.length-1]);const s=p.toString('utf8');return JSON.parse('{'+s.slice(s.indexOf('"data":'))).data;}
const now=()=>new Date(Date.now()+8*3600e3).toISOString().replace(/\.\d+Z$/,'+08:00');
const short=j=>(j.requirements||'').trim().length<20;
async function run(name,file,idOf,fetchOne){
  const jobs=JSON.parse(fs.readFileSync(file)),todo=jobs.filter(short),patch={},fail=[];
  for(const j of todo){const id=idOf(j);try{const r=await fetchOne(j);if(r&&r.text.length>=20)patch[id]={requirements:r.text,source_url:r.url,fetched_at:now()};else fail.push({id,title:j.title,reason:r?.why||'接口返回描述为空'});}catch(e){fail.push({id,title:j.title,reason:String(e.message||e)});}await sleep(1000);}
  fs.writeFileSync(P.join(OUT,name+'.json'),JSON.stringify({company:jobs[0]?.company,source_file:file,id_field:name==='tencent'?'apply_url postid':'id',total:jobs.length,had_desc_before:jobs.length-todo.length,backfilled:Object.keys(patch).length,patch,failures:fail},null,1));
  console.log(name,jobs.length,jobs.length-todo.length,Object.keys(patch).length,fail.length);
}
(async()=>{
 await run('tencent','data/2026-W44/tencent.json',j=>(j.apply_url.match(/postid=(\d+)/i)||[])[1]||j.apply_url,async j=>{
  const pid=(j.apply_url.match(/postid=(\d+)/i)||[])[1];if(!pid)return{why:'非 join.qq.com 来源（Workday），无 postid'};
  const url=`https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?postId=${pid}`;const d=(await (await fetch(url,{headers:UA})).json()).data||{};
  const parts=[[ '岗位描述',d.desc],['岗位要求',d.request],['课题背景',d.topicDetail],['课题要求',d.topicRequirement]].filter(x=>clean(x[1]));
  return{text:parts.map(([k,v])=>`${k}：\n${clean(v)}`).join('\n'),url};});
 for(const n of ['zhihu','shopee','weibo','uisee','biren'])
  await run(n,`staging/2026-W44/startups_node/${n}.json`,j=>j.id,async j=>{
   const m=j.apply_url.match(/mokahr\.com\/[^/]+\/([^/]+)\/(\d+)#\/job\/([\w-]+)/);if(!m)return{why:'无法解析 Moka URL'};
   const r=await fetch('https://app.mokahr.com/api/outer/ats-apply/website/job',{method:'POST',headers:UA,body:JSON.stringify({orgId:m[1],siteId:+m[2],jobId:m[3]})});
   const d=decrypt(await r.json());return{text:clean(d?.jobDescription),url:j.apply_url};});
})();
