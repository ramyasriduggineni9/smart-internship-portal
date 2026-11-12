/* ---------- Skill graph (knowledge-graph style) ---------- */
const SK=["Python","Django","Flask","Pandas","Data Analysis","Statistics","Machine Learning","TensorFlow","REST APIs","Express","Node.js","JavaScript","React","HTML/CSS","SQL","PostgreSQL","MongoDB","Java","Spring Boot","Docker","AWS","Git"];
const POS={"Python":[150,150],"Django":[70,80],"Flask":[70,200],"Pandas":[160,270],"Data Analysis":[260,320],"Statistics":[360,300],"Machine Learning":[260,200],"TensorFlow":[360,130],"REST APIs":[250,60],"Express":[400,50],"Node.js":[490,110],"JavaScript":[570,180],"React":[660,120],"HTML/CSS":[670,240],"SQL":[70,330],"PostgreSQL":[160,385],"MongoDB":[270,385],"Java":[410,360],"Spring Boot":[520,385],"Docker":[470,270],"AWS":[590,310],"Git":[390,205]};
const ED=[["Python","Django",.8],["Python","Flask",.8],["Python","Pandas",.7],["Pandas","Data Analysis",.8],["Data Analysis","Statistics",.7],["Machine Learning","Python",.7],["Machine Learning","TensorFlow",.8],["Machine Learning","Statistics",.6],["JavaScript","React",.8],["JavaScript","Node.js",.8],["Node.js","Express",.85],["Express","REST APIs",.7],["Django","REST APIs",.7],["Flask","REST APIs",.7],["SQL","PostgreSQL",.85],["SQL","MongoDB",.5],["PostgreSQL","MongoDB",.5],["HTML/CSS","React",.6],["HTML/CSS","JavaScript",.6],["Docker","AWS",.6],["Git","Docker",.4],["Java","Spring Boot",.8],["Spring Boot","REST APIs",.7],["Node.js","Python",.4],["Python","JavaScript",.3]];
const M={};SK.forEach(a=>{M[a]={};SK.forEach(b=>M[a][b]=a===b?1:0)});
ED.forEach(([a,b,w])=>{M[a][b]=M[b][a]=w});
SK.forEach(k=>SK.forEach(a=>SK.forEach(b=>{const v=M[a][k]*M[k][b];if(v>M[a][b])M[a][b]=v})));
const ALIAS={"js":"JavaScript","node":"Node.js","nodejs":"Node.js","ml":"Machine Learning","postgres":"PostgreSQL","reactjs":"React","rest":"REST APIs","html":"HTML/CSS","css":"HTML/CSS","tensorflow":"TensorFlow","springboot":"Spring Boot","mongo":"MongoDB","expressjs":"Express"};

/* ---------- Sample data ---------- */
const COURSES=["DBMS","Operating Systems","Data Structures","Web Technologies","Python Programming"];
const LEARN=[
 {id:"c1",t:"Django for Backend Development",skills:["Django","REST APIs"],h:12},
 {id:"c2",t:"Data Analysis with Pandas",skills:["Pandas","Data Analysis"],h:10},
 {id:"c3",t:"React Fundamentals",skills:["React","JavaScript"],h:14},
 {id:"c4",t:"Node.js and Express APIs",skills:["Node.js","Express"],h:10},
 {id:"c5",t:"Applied Statistics",skills:["Statistics"],h:8},
 {id:"c6",t:"Docker and Cloud Basics",skills:["Docker","AWS"],h:9},
 {id:"c7",t:"Java and Spring Boot",skills:["Java","Spring Boot"],h:16},
 {id:"c8",t:"Machine Learning with TensorFlow",skills:["Machine Learning","TensorFlow"],h:18}];
const REGISTRY={"NPTEL-PY-2026-04171":{issuer:"NPTEL",skill:"Python"},"COURSERA-SQL-88231":{issuer:"Coursera",skill:"SQL"},"AWS-CP-2026-7710":{issuer:"AWS",skill:"AWS"},"UDEMY-REACT-30911":{issuer:"Udemy",skill:"React"}};
const S={
 role:"student",view:"feed",mode:"graph",signRole:"Mentor",selJob:"j1",resumeJob:"j1",resume:
`DUGGINENI RAMYA
ramya.d@student.matrusri.edu.in | Hyderabad

EDUCATION
B.E. Computer Science and Engineering, Matrusri Engineering College, CGPA 8.2

PROJECTS
Campus Notice Board: Flask web app with SQL storage, used by 340 students.
Expense Tracker: Python CLI, Git versioned, 120 commits.

SKILLS
Python, Flask, SQL, HTML, CSS, Git`,
 student:{name:"Ramya D.",cgpa:8.2,courses:[...COURSES],skills:["Python","SQL","HTML/CSS","Git","Flask"]},
 employers:[
  {n:"Nimbus Labs",v:true,cin:"U72900TG2018PTC123456"},{n:"Orbit Digital",v:true},{n:"Veda AI",v:true},{n:"Stratus Cloud",v:true},{n:"Kaveri Systems",v:true},{n:"QuickHire Solutions",v:false,why:"CIN not found in registry. Posts 'free training' roles with no mentor."}],
 jobs:[
  {id:"j1",t:"Backend Engineer Intern",e:"Nimbus Labs",req:["Django","REST APIs","SQL","Git"],minCgpa:7,prereq:["DBMS"],loc:"Hyderabad · Hybrid",pay:"₹20,000/mo"},
  {id:"j2",t:"Data Analyst Intern",e:"Nimbus Labs",req:["Pandas","Data Analysis","SQL","Statistics"],minCgpa:7.5,prereq:["DBMS","Python Programming"],loc:"Hyderabad · On-site",pay:"₹18,000/mo"},
  {id:"j3",t:"Full-Stack Web Intern",e:"Orbit Digital",req:["React","Node.js","SQL","HTML/CSS"],minCgpa:7,prereq:["Web Technologies"],loc:"Remote",pay:"₹15,000/mo"},
  {id:"j4",t:"Machine Learning Intern",e:"Veda AI",req:["Machine Learning","Python","TensorFlow","Statistics"],minCgpa:8.5,prereq:["Machine Learning Fundamentals"],loc:"Bengaluru · Hybrid",pay:"₹30,000/mo"},
  {id:"j5",t:"Cloud and DevOps Intern",e:"Stratus Cloud",req:["Docker","AWS","Git"],minCgpa:7,prereq:["Operating Systems"],loc:"Remote",pay:"₹22,000/mo"},
  {id:"j6",t:"Java Developer Intern",e:"Kaveri Systems",req:["Java","Spring Boot","SQL","REST APIs"],minCgpa:7,prereq:["Data Structures"],loc:"Hyderabad · On-site",pay:"₹16,000/mo"},
  {id:"j7",t:"Frontend Developer Intern",e:"Orbit Digital",req:["React","JavaScript","HTML/CSS"],minCgpa:6.5,prereq:["Web Technologies"],loc:"Remote",pay:"₹14,000/mo"},
  {id:"j8",t:"Marketing and Data Entry Intern (free training)",e:"QuickHire Solutions",req:["SQL"],minCgpa:5,prereq:[],loc:"Remote",pay:"Unpaid"}],
 apps:[
  {id:1,job:"j1",who:"You",stage:3,log:[[0,"Applied"],[1,"Under review"],[2,"Interview scheduled"],[3,"Selected"]]},
  {id:2,job:"j1",who:"Kiran P.",stage:2,log:[]},{id:3,job:"j1",who:"Anusha R.",stage:1,log:[]},{id:4,job:"j2",who:"Sai T.",stage:0,log:[]},{id:5,job:"j2",who:"Meghana K.",stage:1,log:[]}],
 msgs:[{from:"Nimbus Labs",t:"Congratulations. You are selected for Backend Engineer Intern. Request your NOC to confirm the start date.",ts:"Today"}],
 noc:null,hours:0,evalScore:null,gradebook:[["Database Management Systems","4","A+"],["Operating Systems","4","A"],["Data Structures","4","A+"],["Web Technologies","3","A"]],pushed:false,
 certs:[],chat:[{b:1,t:"Hi Ramya. I can explain your matches, check eligibility, find skill gaps and track your applications. Try a suggestion below."}],
 done:[],vres:null,vform:{n:"Nimbus Labs Pvt Ltd",cin:"U72900TG2018PTC123456",gst:"36AABCN1234F1Z5",web:"nimbuslabs.in",em:"hr@nimbuslabs.in"}
};
const STAGES=["Applied","Under review","Interview scheduled","Selected","Not selected"];
const CHAIN=["Mentor","HOD","Placement Officer"];
const SIGNERS={"Mentor":"Prof. A.V. Murali Krishna","HOD":"HOD, Dept. of CSE","Placement Officer":"Training and Placement Officer"};
const REQH=120;

/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const job=id=>S.jobs.find(j=>j.id===id);
const emp=n=>S.employers.find(e=>e.n===n);
const now=()=>new Date().toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const hash=s=>{let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))>>>0;return h.toString(16).toUpperCase().padStart(8,"0")};
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
const pct=x=>Math.round(x*100);
function match(j,skills=S.student.skills){
  const rows=j.req.map(r=>{let best=0,from=null;skills.forEach(s=>{if(M[s][r]>best){best=M[s][r];from=s}});return{r,best,from,exact:skills.includes(r)}});
  return{rows,graph:rows.reduce((a,x)=>a+x.best,0)/rows.length,kw:rows.filter(x=>x.exact).length/rows.length};
}
function elig(j){const o=[];if(S.student.cgpa<j.minCgpa)o.push(`CGPA ${S.student.cgpa} is below the minimum ${j.minCgpa}`);j.prereq.forEach(c=>{if(!S.student.courses.includes(c))o.push(`Course not completed: ${c}`)});return o}
const visible=()=>S.jobs.filter(j=>emp(j.e)?.v);
const myApp=()=>S.apps.find(a=>a.who==="You"&&a.stage===3);
const hasApp=id=>S.apps.some(a=>a.who==="You"&&a.job===id);

/* ---------- Navigation ---------- */
const NAV={
 student:[["feed","Recommended"],["graph","Skill graph"],["tracker","Application tracker"],["docs","NOC and certificates"],["credit","Hours and credit"],["resume","Resume optimiser"],["learn","Skill learning"],["chat","Assistant"]],
 employer:[["verify","Verification"],["post","Post a role"],["pipeline","Applicants"],["eval","Evaluation"]],
 admin:[["approvals","Approvals"],["gradebook","Credit transfer"],["analytics","Analytics"],["emps","Employers"]]};
const DEFAULT={student:"feed",employer:"pipeline",admin:"approvals"};
const ROLES={student:"Student",employer:"Employer",admin:"Faculty and admin"};
function badge(v){
  if(v==="approvals"){const n=S.noc&&S.noc.signed.length<3?1:0;return n?`<span class="dot">${n}</span>`:""}
  if(v==="eval"){return S.hours>=REQH&&S.evalScore===null?`<span class="dot">1</span>`:""}
  return"";
}
function renderChrome(){
  $("#roles").innerHTML=Object.entries(ROLES).map(([k,v])=>`<button data-role="${k}" aria-pressed="${S.role===k}">${v}</button>`).join("");
  $("#nav").innerHTML=NAV[S.role].map(([k,v])=>`<button data-view="${k}" ${S.view===k?'aria-current="page"':""}>${v}${badge(k)}</button>`).join("");
}
function render(){renderChrome();$("#main").innerHTML=V[S.role][S.view]();if(S.view==="chat"){const c=$(".chat");if(c)c.scrollTop=c.scrollHeight}}

/* ---------- Student views ---------- */
function jobCard(j,m,showKw){
  const iss=elig(j),applied=hasApp(j.id),v=emp(j.e)?.v;
  const chips=m.rows.map(x=>x.exact?`<span class="chip ok">✓ ${esc(x.r)}</span>`:x.best>=.4?`<span class="chip rel" title="Inferred through the skill graph">≈ ${esc(x.r)} · from ${esc(x.from)} ${pct(x.best)}%</span>`:`<span class="chip gap">Gap: ${esc(x.r)}</span>`).join("");
  const score=S.mode==="graph"?m.graph:m.kw;
  return`<article class="panel job"><div class="job-top"><div><h3>${esc(j.t)}</h3><div class="row small muted"><span>${esc(j.e)}</span>${v?'<span class="chip ok">Verified employer</span>':""}<span>${esc(j.loc)}</span><span>${esc(j.pay)}</span></div></div>
  <div class="score"><b>${pct(score)}%</b><span class="small muted">${S.mode==="graph"?"skill-graph match":"keyword match"}</span></div></div>
  <div class="bar ${S.mode==="graph"?"":"kw"}"><i style="width:${pct(score)}%"></i></div>
  <div class="chips">${chips}</div>
  ${S.mode==="graph"&&m.kw<m.graph-.15?`<div class="why">Keyword search would score this only ${pct(m.kw)}%. Related skills raise it to ${pct(m.graph)}%.</div>`:""}
  <div class="row spread"><div class="small">${iss.length?`<span class="chip bad">Not eligible</span> ${esc(iss.join(". "))}`:`<span class="chip ok">Eligible</span> <span class="muted">Min CGPA ${j.minCgpa}${j.prereq.length?" · "+esc(j.prereq.join(", ")):""}</span>`}</div>
  <button class="btn pri" data-act="apply" data-id="${j.id}" ${iss.length||applied?"disabled":""}>${applied?"Applied":"Apply"}</button></div></article>`;
}
function skillEditor(){
  const free=SK.filter(s=>!S.student.skills.includes(s));
  return`<div class="panel"><h3>Your skills</h3><div class="chips" style="margin-bottom:10px">${S.student.skills.map(s=>`<span class="chip acc">${esc(s)}<button data-act="rmskill" data-s="${esc(s)}" aria-label="Remove ${esc(s)}">×</button></span>`).join("")||'<span class="muted">No skills yet</span>'}</div>
  <div class="row"><select id="addsk" style="max-width:220px" aria-label="Add skill">${free.map(s=>`<option>${esc(s)}</option>`).join("")}</select><button class="btn" data-act="addskill">Add skill</button><span class="small muted">CGPA ${S.student.cgpa} · ${esc(S.student.courses.length)} courses completed</span></div></div>`;
}
const V={student:{},employer:{},admin:{}};
V.student.feed=()=>{
  let list=visible().map(j=>({j,m:match(j)}));
  const key=x=>S.mode==="graph"?x.m.graph:x.m.kw;
  let hidden=[];
  if(S.mode==="keyword"){hidden=list.filter(x=>x.m.kw<.5);list=list.filter(x=>x.m.kw>=.5)}
  list.sort((a,b)=>key(b)-key(a));
  const blocked=S.jobs.filter(j=>!emp(j.e)?.v).length;
  return`<div class="head"><div><h2>Recommended for you</h2><p>Ranked from your profile. Change your skills below and the ranking updates.</p></div>
  <div class="seg" role="group" aria-label="Matching mode"><button data-mode="graph" aria-pressed="${S.mode==="graph"}">Skill-graph</button><button data-mode="keyword" aria-pressed="${S.mode==="keyword"}">Keyword</button></div></div>
  ${skillEditor()}
  ${S.mode==="keyword"?`<div class="note warn"><b>Keyword mode.</b> Only exact skill tags count, so ${hidden.length} listing${hidden.length===1?" is":"s are"} hidden: ${hidden.map(x=>esc(x.j.t)+" ("+pct(x.m.graph)+"% by skill graph)").join(", ")||"none"}.</div>`:`<div class="note">Skill-graph mode treats related skills as partial matches, for example Flask counts toward REST APIs.</div>`}
  ${blocked?`<div class="note bad">${blocked} posting${blocked>1?"s":""} hidden because the employer failed verification.</div>`:""}
  <div style="display:flex;flex-direction:column;gap:12px">${list.map(x=>jobCard(x.j,x.m)).join("")}</div>`;
};
V.student.graph=()=>{
  const j=job(S.selJob),req=j?j.req:[];
  const edges=ED.map(([a,b,w])=>{const [x1,y1]=POS[a],[x2,y2]=POS[b];return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-opacity="${.15+w*.5}" stroke-width="${1+w*2}"/>`}).join("");
  const nodes=SK.map(s=>{const [x,y]=POS[s],mine=S.student.skills.includes(s),r=req.includes(s);
    return`<g><circle cx="${x}" cy="${y}" r="${mine?11:8}" fill="${mine?"var(--accent)":"var(--surface)"}" stroke="${r?"var(--warn)":"var(--muted)"}" stroke-width="${r?3.5:1.2}"/><text x="${x}" y="${y+(y>350?-16:24)}" text-anchor="middle">${esc(s)}</text></g>`}).join("");
  const m=j?match(j):null;
  return`<div class="head"><div><h2>Skill graph</h2><p>Skills are connected by how closely related they are. Match scores come from the strongest path between your skills and what a role needs.</p></div>
  <label>Highlight role<select id="seljob">${visible().map(x=>`<option value="${x.id}" ${x.id===S.selJob?"selected":""}>${esc(x.t)}</option>`).join("")}</select></label></div>
  <div class="panel"><div class="tw"><svg viewBox="0 0 740 420" style="min-width:640px;width:100%;height:auto" role="img" aria-label="Skill graph">${edges}${nodes}</svg></div>
  <div class="row small muted" style="margin-top:8px"><span><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="var(--accent)"/></svg> your skill</span><span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--warn)" stroke-width="3"/></svg> required by role</span><span>Line weight shows relatedness</span></div></div>
  ${m?`<div class="panel"><h3>${esc(j.t)}: ${pct(m.graph)}% match</h3><div class="why">${m.rows.map(x=>x.exact?`✓ ${esc(x.r)}: you have it`:x.best>=.4?`≈ ${esc(x.r)}: ${pct(x.best)}% via ${esc(x.from)}`:`✗ ${esc(x.r)}: closest skill is ${pct(x.best)}%. Consider a course.`).join("<br>")}</div></div>`:""}`;
};
function kanban(apps,mode){
  const cols=[0,1,2,3,4];
  return`<div class="kan">${cols.map(c=>{const items=apps.filter(a=>a.stage===c);return`<div class="col"><h4>${STAGES[c]}<span>${items.length}</span></h4>${items.map(a=>{const j=job(a.job);
    return`<div class="card ${a.who==="You"?"me":""}"><b>${mode==="emp"?esc(a.who):esc(j.t)}</b><span class="muted small">${mode==="emp"?esc(j.t):esc(j.e)}</span>
    ${mode==="emp"&&c<3?`<div class="row"><button class="btn sm pri" data-act="move" data-id="${a.id}">Move to ${STAGES[c+1]}</button><button class="btn sm" data-act="reject" data-id="${a.id}">Reject</button></div>`:""}</div>`}).join("")||'<span class="small muted">None</span>'}</div>`}).join("")}</div>`;
}
V.student.tracker=()=>{
  const mine=S.apps.filter(a=>a.who==="You");
  return`<div class="head"><div><h2>Application tracker</h2><p>Every status change appears here as soon as the employer makes it. Switch to the Employer view and move a candidate to see it update.</p></div></div>
  <div class="panel"><h3>Your applications</h3>${mine.length?kanban(mine,"stu"):'<p class="muted">No applications yet. Apply from Recommended.</p>'}</div>
  <div class="panel"><h3>Communication hub</h3><div style="display:flex;flex-direction:column;gap:8px">${S.msgs.map(m=>`<div class="card"><div class="row spread"><b>${esc(m.from)}</b><span class="small muted mono">${esc(m.ts)}</span></div>${esc(m.t)}</div>`).join("")}</div></div>`;
};
function nocBlock(){
  const a=myApp();
  if(!a)return`<div class="note">You will be able to request a No Objection Certificate once an employer selects you.</div>`;
  const j=job(a.job);
  if(!S.noc)return`<div class="row spread"><div><b>${esc(j.t)}</b> at ${esc(j.e)}<div class="small muted">Selected. Your NOC goes to your mentor, then the HOD, then the placement officer.</div></div><button class="btn pri" data-act="reqnoc">Request NOC</button></div>`;
  return`<div style="margin-bottom:10px"><b>NOC: ${esc(j.t)}, ${esc(j.e)}</b></div><div class="steps">${CHAIN.map((r,i)=>{const s=S.noc.signed[i];const cls=s?"done":i===S.noc.signed.length?"next":"";
   return`<div class="step ${cls}"><span class="small muted">${r}</span>${s?`<span class="sig">${esc(s.name)}</span><span class="small mono muted">${esc(s.ts)} · ${s.h}</span>`:`<span class="small">${i===S.noc.signed.length?"Waiting for signature":"Queued"}</span>`}</div>`}).join("")}</div>
   ${S.noc.signed.length===3?'<div class="note good" style="margin-top:10px">NOC fully signed. You can start the internship and log hours under Hours and credit.</div>':""}`;
}
V.student.docs=()=>`<div class="head"><div><h2>NOC and certificates</h2><p>Approvals move through an online chain of command. Certificates are checked against a registry before they count.</p></div></div>
  <div class="panel"><h3>No Objection Certificate</h3>${nocBlock()}</div>
  <div class="panel"><h3>Certificate verification</h3>
  <form class="form" id="certform"><label>Certificate title<input id="ct" value="Python for Everybody" required></label>
  <label>Issuer<select id="ci"><option>NPTEL</option><option>Coursera</option><option>AWS</option><option>Udemy</option></select></label>
  <label>Credential ID<input id="cid" value="NPTEL-PY-2026-04171" required></label>
  <label>&nbsp;<button class="btn pri" type="submit">Verify</button></label></form>
  <p class="small muted" style="margin-top:8px">Sample IDs that verify: ${Object.keys(REGISTRY).join(", ")}. Any other ID is rejected.</p>
  ${S.certs.length?`<div class="tw" style="margin-top:10px"><table><tr><th>Certificate</th><th>Issuer</th><th>ID</th><th>Status</th></tr>${S.certs.map(c=>`<tr><td>${esc(c.t)}</td><td>${esc(c.i)}</td><td class="mono">${esc(c.id)}</td><td><span class="chip ${c.ok?"ok":"bad"}">${c.ok?"Verified":"Rejected"}</span> <span class="small muted">${esc(c.note)}</span></td></tr>`).join("")}</table></div>`:""}</div>`;
V.student.credit=()=>{
  const a=myApp(),active=S.noc&&S.noc.signed.length===3,pc=Math.min(100,Math.round(S.hours/REQH*100));
  const gpa=S.gradebook;
  return`<div class="head"><div><h2>Hours and credit</h2><p>Logged hours and the employer evaluation feed your gradebook. Faculty confirms the transfer.</p></div></div>
  <div class="panel"><h3>Internship progress</h3>${active?`<div class="row spread"><span>${esc(job(a.job).t)} · ${esc(job(a.job).e)}</span><span class="mono">${S.hours} / ${REQH} h</span></div><div class="bar" style="margin:8px 0"><i style="width:${pc}%"></i></div>
   <div class="row"><button class="btn pri" data-act="hours" ${S.hours>=REQH?"disabled":""}>Log 20 hours</button><span class="small muted">${S.evalScore===null?(S.hours>=REQH?"Hours complete. Waiting for the employer evaluation.":"Evaluation opens at "+REQH+" hours."):`Employer score: ${S.evalScore}/100`}</span></div>`:'<p class="muted">Available after your NOC is fully signed.</p>'}</div>
  <div class="panel"><h3>University gradebook</h3><div class="tw"><table><tr><th>Course</th><th>Credits</th><th>Grade</th></tr>${gpa.map(r=>`<tr><td>${esc(r[0])}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td></tr>`).join("")}</table></div>
  ${S.pushed?'<div class="note good" style="margin-top:10px">Internship credits were pushed to the gradebook after supervisor evaluation.</div>':""}</div>`;
};
function analyse(text,j){
  const t=text.toLowerCase(),found=new Set();
  SK.forEach(s=>{if(t.includes(s.toLowerCase()))found.add(s)});
  Object.entries(ALIAS).forEach(([k,v])=>{if(new RegExp("(^|[^a-z])"+k+"([^a-z]|$)").test(t))found.add(v)});
  const m=match(j,[...found]);
  const checks=[["Contact email",/@/.test(text),8],["Education section",/education|b\.e\.|b\.tech/i.test(text),7],["Projects section",/project/i.test(text),8],["Quantified results",/\d+\s*(%|students|users|commits|x)/i.test(text),7]];
  const ats=Math.round(m.graph*70+checks.reduce((a,c)=>a+(c[1]?c[2]:0),0));
  return{found:[...found],m,checks,ats};
}
V.student.resume=()=>{
  const j=job(S.resumeJob),r=S.vres;
  const gaps=r?r.m.rows.filter(x=>x.best<.6):[];
  const recs=[...new Set(gaps.flatMap(g=>LEARN.filter(c=>c.skills.includes(g.r))))];
  return`<div class="head"><div><h2>Resume optimiser</h2><p>Paste your resume text and pick a role. It reads the skills in your resume, scores them against the role and suggests courses for the gaps.</p></div></div>
  <div class="grid2"><div class="panel"><label>Target role<select id="rjob">${visible().map(x=>`<option value="${x.id}" ${x.id===S.resumeJob?"selected":""}>${esc(x.t)}, ${esc(x.e)}</option>`).join("")}</select></label>
  <label style="margin-top:10px">Resume text<textarea id="rtext">${esc(S.resume)}</textarea></label><div class="row" style="margin-top:10px"><button class="btn pri" data-act="analyse">Analyse resume</button></div></div>
  <div class="panel"><h3>Result</h3>${r?`<div class="row spread"><span class="stat"><b>${r.ats}</b><span class="small muted">ATS score out of 100</span></span><span class="stat"><b>${pct(r.m.graph)}%</b><span class="small muted">skill-graph fit to ${esc(j.t)}</span></span></div>
   <div class="bar" style="margin:10px 0"><i style="width:${r.ats}%"></i></div>
   <div class="small muted">Skills found</div><div class="chips" style="margin:4px 0 10px">${r.found.map(s=>`<span class="chip ok">${esc(s)}</span>`).join("")||"None"}</div>
   <div class="small muted">Resume checks</div><div class="why" style="margin:4px 0 10px">${r.checks.map(c=>`${c[1]?"✓":"✗"} ${c[0]}`).join("<br>")}</div>
   <div class="small muted">Skill gaps</div><div class="chips" style="margin:4px 0 10px">${gaps.map(g=>`<span class="chip gap">${esc(g.r)} · ${pct(g.best)}%</span>`).join("")||'<span class="chip ok">No gaps</span>'}</div>
   ${recs.length?`<div class="small muted">Recommended courses</div>${recs.map(c=>`<div class="row spread card" style="margin-top:6px"><span>${esc(c.t)} <span class="muted small">${c.h} h</span></span><button class="btn sm" data-go="learn">Open</button></div>`).join("")}`:""}`:'<p class="muted">Run the analysis to see your score.</p>'}</div></div>`;
};
V.student.learn=()=>`<div class="head"><div><h2>Skill learning</h2><p>Finish a course assessment and its skills are added to your profile, which updates your recommendations. Assessments are simulated in this prototype.</p></div></div>
  <div class="grid2">${LEARN.map(c=>{const d=S.done.includes(c.id);return`<div class="panel"><div class="row spread"><h3>${esc(c.t)}</h3><span class="small muted mono">${c.h} h</span></div><div class="chips" style="margin:8px 0">${c.skills.map(s=>`<span class="chip ${S.student.skills.includes(s)?"ok":""}">${esc(s)}</span>`).join("")}</div>
  <button class="btn ${d?"":"pri"}" data-act="learn" data-id="${c.id}" ${d?"disabled":""}>${d?"Assessment passed":"Take assessment"}</button></div>`}).join("")}</div>`;
function reply(q){
  const t=q.toLowerCase(),L=visible().map(j=>({j,m:match(j)})).sort((a,b)=>b.m.graph-a.m.graph);
  if(/best|recommend|which|suit/.test(t)){const x=L[0];return`Your best match is ${x.j.t} at ${x.j.e}, ${pct(x.m.graph)}% by skill graph. ${x.m.rows.filter(r=>r.best<.6).length?"To strengthen it, work on: "+x.m.rows.filter(r=>r.best<.6).map(r=>r.r).join(", ")+".":"You already cover every required skill."}\nNext: ${L[1].j.t} (${pct(L[1].m.graph)}%).`}
  if(/eligib|cgpa|qualif/.test(t))return L.map(x=>{const i=elig(x.j);return`${x.j.t}: ${i.length?"not eligible. "+i.join("; "):"eligible"}`}).join("\n");
  if(/gap|missing|learn|improve|skill/.test(t)){const x=L[0];const g=x.m.rows.filter(r=>r.best<.6);return g.length?`For ${x.j.t} you are weakest in ${g.map(r=>r.r).join(", ")}. Suggested: ${[...new Set(g.flatMap(r=>LEARN.filter(c=>c.skills.includes(r.r)).map(c=>c.t)))].join("; ")}.`:`No major gaps for ${x.j.t}.`}
  if(/status|track|appl/.test(t)){const m=S.apps.filter(a=>a.who==="You");return m.length?m.map(a=>`${job(a.job).t}: ${STAGES[a.stage]}`).join("\n"):"You have not applied anywhere yet."}
  if(/noc|sign|approv/.test(t))return S.noc?`Your NOC has ${S.noc.signed.length} of 3 signatures. ${S.noc.signed.length<3?"Next: "+CHAIN[S.noc.signed.length]+".":"It is complete."}`:"Request a NOC from the NOC and certificates page once you are selected.";
  if(/resume|ats|cv/.test(t))return"Open Resume optimiser, paste your text and choose a role. It returns an ATS score, skill gaps and course suggestions.";
  return"I can help with: best internship, eligibility, skill gaps, application status, NOC status, resume tips.";
}
V.student.chat=()=>`<div class="head"><div><h2>Assistant</h2><p>Answers come from your profile and the live data in this prototype.</p></div></div>
  <div class="panel"><div class="chat">${S.chat.map(m=>`<div class="msg ${m.b?"b":"u"}">${esc(m.t)}</div>`).join("")}</div>
  <div class="chips" style="margin:10px 0">${["Which internship is best for me?","Am I eligible for all roles?","What skills am I missing?","What is my application status?","NOC status"].map(q=>`<button class="btn sm" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
  <form class="row" id="chatform" style="flex-wrap:nowrap"><input id="chatq" placeholder="Ask a question" autocomplete="off" aria-label="Ask a question"><button class="btn pri" type="submit">Send</button></form></div>`;

/* ---------- Employer views ---------- */
const me="Nimbus Labs";
V.employer.verify=()=>{
  const f=S.vform,r=S.vres2;
  return`<div class="head"><div><h2>Employer verification</h2><p>New employers are checked automatically before any posting reaches students. The sample values below are fictional.</p></div></div>
  <div class="panel"><form class="form" id="vform"><label>Company name<input id="vn" value="${esc(f.n)}"></label><label>CIN (21 characters)<input id="vc" value="${esc(f.cin)}"></label><label>GSTIN (15 characters)<input id="vg" value="${esc(f.gst)}"></label><label>Company website<input id="vw" value="${esc(f.web)}"></label><label>HR email<input id="ve" value="${esc(f.em)}"></label>
  <label>&nbsp;<span class="row"><button class="btn pri" type="submit">Run verification</button><button class="btn" type="button" data-act="badv">Load invalid sample</button></span></label></form></div>
  ${r?`<div class="panel"><h3>${r.ok?"Verified. You can post roles.":"Verification failed"}</h3><div class="why">${r.c.map(c=>`${c[1]?"✓":"✗"} ${c[0]}`).join("<br>")}</div></div>`:""}`;
};
V.employer.post=()=>`<div class="head"><div><h2>Post a role</h2><p>Posting as ${me}. Required skills feed the matching engine, so list what the intern will actually do.</p></div></div>
  <div class="panel"><form id="pform" style="display:flex;flex-direction:column;gap:12px"><div class="form"><label>Role title<input id="pt" value="Site Reliability Intern" required></label><label>Minimum CGPA<input id="pg" type="number" step="0.1" min="0" max="10" value="7"></label>
  <label>Prerequisite course<select id="pp"><option value="">None</option>${COURSES.map(c=>`<option>${c}</option>`).join("")}</select></label><label>Stipend<input id="ps" value="₹20,000/mo"></label></div>
  <div><div class="small muted" style="margin-bottom:6px">Required skills (pick 2 to 5)</div><div class="chips">${SK.map(s=>`<label style="flex-direction:row;align-items:center;gap:4px;border:1px solid var(--line);padding:3px 9px;border-radius:99px;background:var(--bg)"><input type="checkbox" name="rs" value="${s}" ${["Docker","AWS","Git"].includes(s)?"checked":""} style="width:auto">${esc(s)}</label>`).join("")}</div></div>
  <div><button class="btn pri" type="submit">Publish role</button></div></form></div>`;
V.employer.pipeline=()=>{
  const apps=S.apps.filter(a=>job(a.job).e===me);
  return`<div class="head"><div><h2>Applicants</h2><p>Moving a candidate sends a message to the student and updates their tracker instantly.</p></div></div>
  <div class="panel">${kanban(apps,"emp")}</div>`;
};
V.employer.eval=()=>{
  const a=myApp();
  return`<div class="head"><div><h2>Intern evaluation</h2><p>Open after the intern logs ${REQH} hours. The score goes to faculty for the gradebook.</p></div></div>
  <div class="panel">${!a?'<p class="muted">No selected intern yet.</p>':`<div class="row spread"><span><b>Ramya D.</b> · ${esc(job(a.job).t)}</span><span class="mono">${S.hours} / ${REQH} h</span></div>
  ${S.evalScore!==null?`<div class="note good" style="margin-top:10px">Evaluation submitted: ${S.evalScore}/100.</div>`:S.hours<REQH?'<div class="note warn" style="margin-top:10px">Waiting for the intern to complete the required hours. Log hours from the Student view.</div>':`<form class="row" id="eform" style="margin-top:10px"><label>Score (0 to 100)<input id="es" type="number" min="0" max="100" value="86" required style="width:120px"></label><label>&nbsp;<button class="btn pri" type="submit">Submit evaluation</button></label></form>`}`}</div>`;
};

/* ---------- Admin views ---------- */
V.admin.approvals=()=>{
  const n=S.noc,next=n?n.signed.length:null,a=myApp();
  const can=n&&next<3&&CHAIN[next]===S.signRole;
  return`<div class="head"><div><h2>Approvals</h2><p>Each NOC is signed in order. Choose the role you are signing as.</p></div>
  <div class="seg" role="group" aria-label="Signing as">${CHAIN.map(r=>`<button data-sr="${r}" aria-pressed="${S.signRole===r}">${r}</button>`).join("")}</div></div>
  <div class="panel">${!n?'<p class="muted">No approval requests. The student requests a NOC after being selected.</p>':`<div class="row spread" style="margin-bottom:10px"><span><b>NOC request</b> · Ramya D. · ${esc(job(a.job).t)}, ${esc(job(a.job).e)}</span><span class="chip ${next===3?"ok":"rel"}">${next===3?"Complete":"Awaiting "+CHAIN[next]}</span></div>${nocBlock().replace(/^<div style="margin-bottom:10px">.*?<\/div>/,"")}
  ${can?`<form class="row" id="sform" style="margin-top:12px"><label>Type your full name to sign<input id="sn" value="${esc(SIGNERS[S.signRole])}" required></label><label>&nbsp;<button class="btn pri" type="submit">Sign as ${S.signRole}</button></label></form>`:(next<3?`<div class="note warn" style="margin-top:12px">Next signature is ${CHAIN[next]}. Switch the role above to sign.</div>`:"")}`}</div>`;
};
V.admin.gradebook=()=>{
  const ready=S.evalScore!==null&&!S.pushed;
  const g=s=>s>=85?"A+":s>=70?"A":s>=60?"B":"C";
  return`<div class="head"><div><h2>Credit transfer</h2><p>Internship credits are added after the supervisor evaluation arrives.</p></div></div>
  <div class="panel"><div class="tw"><table><tr><th>Student</th><th>Hours</th><th>Employer score</th><th>Proposed grade</th><th>Credits</th><th></th></tr>
  <tr><td>Ramya D.</td><td class="mono">${S.hours}/${REQH}</td><td class="mono">${S.evalScore===null?"Pending":S.evalScore}</td><td class="mono">${S.evalScore===null?"-":g(S.evalScore)}</td><td class="mono">2</td>
  <td>${S.pushed?'<span class="chip ok">In gradebook</span>':`<button class="btn pri sm" data-act="push" ${ready?"":"disabled"}>Push to gradebook</button>`}</td></tr></table></div>
  ${!S.noc?'<p class="small muted" style="margin-top:8px">Nothing to transfer yet. Run the flow: apply, get selected, sign NOC, log hours, evaluate.</p>':""}</div>`;
};
V.admin.analytics=()=>{
  const c=STAGES.map((s,i)=>S.apps.filter(a=>a.stage===i).length),max=Math.max(1,...c);
  const per={};S.apps.forEach(a=>job(a.job).req.forEach(s=>per[s]=(per[s]||0)+1));
  const top=Object.entries(per).sort((a,b)=>b[1]-a[1]).slice(0,6),tm=Math.max(1,...top.map(x=>x[1]));
  return`<div class="head"><div><h2>Placement analytics</h2><p>Live from the data in this prototype.</p></div></div>
  <div class="stats"><div class="panel stat"><b>${S.apps.length}</b><span class="small muted">Applications</span></div><div class="panel stat"><b>${S.employers.filter(e=>e.v).length}</b><span class="small muted">Verified employers</span></div><div class="panel stat"><b>${S.employers.filter(e=>!e.v).length}</b><span class="small muted">Blocked employers</span></div><div class="panel stat"><b>${S.apps.filter(a=>a.stage===3).length}</b><span class="small muted">Students selected</span></div></div>
  <div class="grid2"><div class="panel"><h3>Applications by stage</h3><div style="display:flex;flex-direction:column;gap:8px">${STAGES.map((s,i)=>`<div class="hbar"><span>${s}</span><div class="bar"><i style="width:${c[i]/max*100}%"></i></div><b class="mono">${c[i]}</b></div>`).join("")}</div></div>
  <div class="panel"><h3>Most requested skills</h3><div style="display:flex;flex-direction:column;gap:8px">${top.map(([s,n])=>`<div class="hbar"><span>${esc(s)}</span><div class="bar"><i style="width:${n/tm*100}%"></i></div><b class="mono">${n}</b></div>`).join("")}</div></div></div>
  <p class="small muted">The brief reports a 35% improvement in processing efficiency and about 3 weeks less time-to-hire from institutional testing. This prototype does not measure those figures.</p>`;
};
V.admin.emps=()=>`<div class="head"><div><h2>Employers</h2><p>Only verified employers appear in student feeds.</p></div></div>
  <div class="panel"><div class="tw"><table><tr><th>Employer</th><th>Postings</th><th>Status</th><th>Note</th></tr>${S.employers.map(e=>`<tr><td>${esc(e.n)}</td><td class="mono">${S.jobs.filter(j=>j.e===e.n).length}</td><td><span class="chip ${e.v?"ok":"bad"}">${e.v?"Verified":"Blocked"}</span></td><td class="small muted">${esc(e.why||"")}</td></tr>`).join("")}</table></div></div>`;

/* ---------- Actions ---------- */
function setMsg(from,t){S.msgs.unshift({from,t,ts:now()})}
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.role){S.role=t.dataset.role;S.view=DEFAULT[S.role];return render()}
  if(t.dataset.view){S.view=t.dataset.view;return render()}
  if(t.dataset.go){S.view=t.dataset.go;return render()}
  if(t.dataset.mode){S.mode=t.dataset.mode;return render()}
  if(t.dataset.sr){S.signRole=t.dataset.sr;return render()}
  const a=t.dataset.act;if(!a)return;
  const st=S.student;
  if(a==="apply"){const j=job(t.dataset.id);S.apps.push({id:Date.now(),job:j.id,who:"You",stage:0,log:[[0,"Applied"]]});toast("Applied to "+j.t)}
  else if(a==="rmskill"){st.skills=st.skills.filter(s=>s!==t.dataset.s)}
  else if(a==="addskill"){const v=$("#addsk")?.value;if(v)st.skills.push(v)}
  else if(a==="move"){const x=S.apps.find(p=>p.id==t.dataset.id);x.stage++;if(x.who==="You"){setMsg(job(x.job).e,x.stage===3?`Congratulations. You are selected for ${job(x.job).t}. Request your NOC to confirm the start date.`:`Your application for ${job(x.job).t} is now: ${STAGES[x.stage]}.`)}toast(x.who+": "+STAGES[x.stage])}
  else if(a==="reject"){const x=S.apps.find(p=>p.id==t.dataset.id);x.stage=4;if(x.who==="You")setMsg(job(x.job).e,`Thank you for applying to ${job(x.job).t}. We will not move forward this time.`);toast(x.who+" marked not selected")}
  else if(a==="reqnoc"){S.noc={signed:[]};setMsg("Placement Cell","NOC requested. It will be signed by your mentor, HOD and the placement officer.");toast("NOC request sent to your mentor")}
  else if(a==="hours"){S.hours=Math.min(REQH,S.hours+20);toast(S.hours+" hours logged")}
  else if(a==="analyse"){S.resume=$("#rtext").value;S.resumeJob=$("#rjob").value;S.vres=analyse(S.resume,job(S.resumeJob))}
  else if(a==="learn"){const c=LEARN.find(x=>x.id===t.dataset.id);S.done.push(c.id);c.skills.forEach(s=>{if(!st.skills.includes(s))st.skills.push(s)});toast("Skills added: "+c.skills.join(", "))}
  else if(a==="ask"){S.chat.push({t:t.dataset.q},{b:1,t:reply(t.dataset.q)})}
  else if(a==="badv"){S.vform={n:"QuickHire Solutions",cin:"12345",gst:"ABCDE",web:"quickhire.example",em:"quickhire.jobs@gmail.com"}}
  else if(a==="push"){S.pushed=true;S.gradebook.push(["Internship (CSE-INT)","2",S.evalScore>=85?"A+":S.evalScore>=70?"A":S.evalScore>=60?"B":"C"]);setMsg("Examination Section","Internship credits were added to your gradebook.");toast("Credits pushed to gradebook")}
  render();
});
document.addEventListener("change",e=>{
  if(e.target.id==="seljob"){S.selJob=e.target.value;render()}
});
document.addEventListener("submit",e=>{
  e.preventDefault();const id=e.target.id;
  if(id==="certform"){const cid=$("#cid").value.trim(),iss=$("#ci").value,r=REGISTRY[cid];
    const ok=!!r&&r.issuer===iss;
    S.certs.unshift({t:$("#ct").value,i:iss,id:cid,ok,note:ok?"Matches registry. Skill added: "+r.skill:r?"Issuer does not match this ID":"ID not found in registry"});
    if(ok&&!S.student.skills.includes(r.skill))S.student.skills.push(r.skill)}
  if(id==="chatform"){const q=$("#chatq").value.trim();if(!q)return;S.chat.push({t:q},{b:1,t:reply(q)})}
  if(id==="vform"){
    const f=S.vform={n:$("#vn").value,cin:$("#vc").value.trim(),gst:$("#vg").value.trim(),web:$("#vw").value.trim(),em:$("#ve").value.trim()};
    const dom=f.em.split("@")[1]||"",free=/^(gmail|yahoo|outlook|hotmail)\./i.test(dom);
    const c=[["CIN format valid (21 characters)",/^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(f.cin)],["GSTIN format valid (15 characters)",/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(f.gst)],["HR email uses a company domain, not a free provider",!!dom&&!free],["Email domain matches website",!!dom&&f.web.toLowerCase().replace(/^https?:\/\/(www\.)?/,"")===dom.toLowerCase()]];
    const ok=c.every(x=>x[1]);S.vres2={ok,c};
    if(ok&&!emp(f.n))S.employers.push({n:f.n,v:true,cin:f.cin});
    if(!ok){const x=emp(f.n);if(x)x.v=false}
    toast(ok?"Employer verified":"Verification failed")}
  if(id==="pform"){const sk=[...document.querySelectorAll('input[name=rs]:checked')].map(x=>x.value);
    if(sk.length<2||sk.length>5)return toast("Pick between 2 and 5 skills");
    S.jobs.push({id:"j"+(S.jobs.length+1),t:$("#pt").value,e:me,req:sk,minCgpa:+$("#pg").value,prereq:$("#pp").value?[$("#pp").value]:[],loc:"Hyderabad · Hybrid",pay:$("#ps").value});
    toast("Role published. Students see it in their feed.");S.view="pipeline"}
  if(id==="sform"){const name=$("#sn").value.trim();if(!name)return;const ts=now();S.noc.signed.push({name,ts,h:hash(name+ts+S.noc.signed.length)});
    if(S.noc.signed.length===3)setMsg("Placement Cell","Your NOC is fully signed. You can start the internship.");
    else setMsg("Placement Cell",`NOC signed by ${CHAIN[S.noc.signed.length-1]}. Next: ${CHAIN[S.noc.signed.length]}.`);
    toast("Signed as "+S.signRole)}
  if(id==="eform"){S.evalScore=+$("#es").value;setMsg(me,"Your internship evaluation was submitted: "+S.evalScore+"/100.");toast("Evaluation sent to faculty")}
  render();
});
render();
