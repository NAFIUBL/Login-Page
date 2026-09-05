let data = [];
let selectedUser = null;

// ==========================================
// AUTH GUARD + ROLE SETUP (Uploader / Viewer)
// ==========================================

const role = localStorage.getItem("ofsRole");
const currentUser = localStorage.getItem("ofsUser");

if (!role) {
  window.location.href = "index.html";
}

const demo = [
  {town:"Jhenaidah",code:"SM001",name:"Arif Hossain",scheduled:92,nonScheduled:18,productive:88,bp:80},
  {town:"Jhenaidah",code:"SM002",name:"Rakib Hasan",scheduled:86,nonScheduled:15,productive:69,bp:68},
  {town:"Harinakundu",code:"SM003",name:"Sabbir Ahmed",scheduled:75,nonScheduled:12,productive:65,bp:75},
  {town:"Kaliganj",code:"SM004",name:"Tanvir Islam",scheduled:98,nonScheduled:20,productive:91,bp:82},
  {town:"Kotchandpur",code:"SM005",name:"Munna Rahman",scheduled:80,nonScheduled:21,productive:51,bp:50},
  {town:"Maheshpur",code:"SM006",name:"Nayeem Khan",scheduled:72,nonScheduled:13,productive:57,bp:67},
  {town:"Shailkupa",code:"SM007",name:"Sakib Ali",scheduled:89,nonScheduled:16,productive:78,bp:74},
  {town:"Jhenaidah",code:"SM008",name:"Rasel Mia",scheduled:83,nonScheduled:10,productive:76,bp:92}
];

function n(v){ if(v===null||v===undefined||v==="") return 0; const x=parseFloat(String(v).replace(/[% ,]/g,"")); return isNaN(x)?0:x; }
function key(s){return String(s??"").toLowerCase().replace(/[^a-z0-9]/g,"");}
function findCol(row, names){
  const ks=Object.keys(row); const wanted=names.map(key);
  return ks.find(k=>wanted.includes(key(k))) || ks.find(k=>wanted.some(w=>key(k).includes(w)));
}
function normalizeRow(r){
  const townK=findCol(r,["Town","Territory","Area","City"]);
  const codeK=findCol(r,["Code","Salesman Code","SO Code","Employee Code"]);
  const nameK=findCol(r,["Salesman","Salesman Name","SO Name","Name","Employee"]);
  const schK=findCol(r,["Scheduled","Schedule","Scheduled Outlet","S"]);
  const nsK=findCol(r,["Non Scheduled","Non-Scheduled","NS","NonScheduled"]);
  const prodK=findCol(r,["Productive Call","Productive","ProductiveCall","PC"]);
  const bpK=findCol(r,["BP%","BP","Bill Productivity","Bill Productivity %","Achievement"]);
  let scheduled=n(r[schK]), nonScheduled=n(r[nsK]), productive=n(r[prodK]), bp=n(r[bpK]);
  if(!bp && (scheduled+nonScheduled)>0 && productive>0) bp=(productive/(scheduled+nonScheduled))*100;
  return {town:String(r[townK]??"Unknown").trim()||"Unknown",code:String(r[codeK]??"").trim(),name:String(r[nameK]??"Unknown").trim()||"Unknown",scheduled,nonScheduled,productive,bp};
}
function initials(name){return String(name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();}
function bpClass(v){return v>=80?"bp-good":v>=60?"bp-mid":"bp-low";}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;}
function fmt(v){return Math.round(v*10)/10;}
function set(id,text){const e=document.getElementById(id);if(e)e.textContent=text;}

function render(){
  const totalSalesman=data.length;
  const totalOutlets=data.reduce((s,r)=>s+r.scheduled+r.nonScheduled,0);
  const productive=data.reduce((s,r)=>s+r.productive,0);
  const avgBP=avg(data.map(r=>r.bp));
  set("totalSalesman",totalSalesman);set("totalOutlets",totalOutlets);set("productiveCall",productive);set("averageBP",fmt(avgBP)+"%");
  set("donutValue",fmt(avgBP)+"%");
  set("bpStatus",avgBP>=80?"Excellent territory performance":avgBP>=60?"Needs steady improvement":"Needs immediate attention");
  set("salesmanTrend",totalSalesman?`${totalSalesman} active records loaded`:"Upload a report to begin");
  const deg=Math.max(0,Math.min(100,avgBP))*3.6;
  document.getElementById("donut").style.background=`conic-gradient(#6971ed 0deg ${deg}deg,#edf0f5 ${deg}deg 360deg)`;
  const good=data.filter(r=>r.bp>=80).length, mid=data.filter(r=>r.bp>=60&&r.bp<80).length, low=data.filter(r=>r.bp<60).length;
  set("goodCount",good);set("midCount",mid);set("lowCount",low);

  renderTown(); renderPerformers(); renderSalesmen(); renderTownCards(); populateTownFilter();
  set("lastUpdate",new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
}

function townSummary(){
  const map={};
  data.forEach(r=>{if(!map[r.town])map[r.town]={town:r.town,salesmen:0,outlets:0,productive:0,bps:[]};let t=map[r.town];t.salesmen++;t.outlets+=r.scheduled+r.nonScheduled;t.productive+=r.productive;t.bps.push(r.bp);});
  return Object.values(map).map(t=>({...t,bp:avg(t.bps)})).sort((a,b)=>b.bp-a.bp);
}
function renderTown(){
  const body=document.getElementById("townTable"); if(!body)return;
  const rows=townSummary();
  body.innerHTML=rows.length?rows.map(t=>`<tr><td><b>${escapeHtml(t.town)}</b></td><td>${t.salesmen}</td><td>${t.outlets}</td><td>${t.productive}</td><td><span class="bp-pill ${bpClass(t.bp)}">${fmt(t.bp)}%</span></td><td><div class="progress"><i style="width:${Math.min(t.bp,100)}%"></i></div></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No data. Upload an Excel file.</td></tr>`;
}
function performerHTML(r){
  return `<div class="performer" onclick="openSalesmanProfile('${encodeURIComponent(r.code||r.name)}')"><div class="mini-avatar">${initials(r.name)}</div><div class="performer-info"><b>${escapeHtml(r.name)}</b><span>${escapeHtml(r.town)} · ${escapeHtml(r.code||"—")}</span></div><div class="performer-score ${bpClass(r.bp)}">${fmt(r.bp)}%</div></div>`;
}
function renderPerformers(){
  const sorted=[...data].sort((a,b)=>b.bp-a.bp);
  document.getElementById("topPerformerList").innerHTML=sorted.slice(0,5).map(performerHTML).join("")||'<div class="empty">No data yet.</div>';
  document.getElementById("lowPerformerList").innerHTML=sorted.slice(-5).reverse().map(performerHTML).join("")||'<div class="empty">No data yet.</div>';
}
function populateTownFilter(){
  const s=document.getElementById("salesmanTownFilter"); if(!s)return;
  const current=s.value; const towns=[...new Set(data.map(r=>r.town))].sort();
  s.innerHTML='<option value="All">All Town</option>'+towns.map(t=>`<option>${escapeHtml(t)}</option>`).join("");
  if(towns.includes(current))s.value=current;
}
function renderSalesmen(){
  const town=document.getElementById("salesmanTownFilter")?.value||"All";
  const q=(document.getElementById("salesmanSearchBox")?.value||"").toLowerCase();
  const sort=document.getElementById("salesmanSort")?.value||"bp_desc";
  let rows=data.filter(r=>(town==="All"||r.town===town)&&(`${r.name} ${r.code} ${r.town}`).toLowerCase().includes(q));
  if(sort==="bp_desc")rows.sort((a,b)=>b.bp-a.bp); else if(sort==="bp_asc")rows.sort((a,b)=>a.bp-b.bp); else rows.sort((a,b)=>a.name.localeCompare(b.name));
  document.getElementById("salesmanTable").innerHTML=rows.length?rows.map(r=>`<tr onclick="openSalesmanProfile('${encodeURIComponent(r.code||r.name)}')"><td>${escapeHtml(r.town)}</td><td>${escapeHtml(r.code||"—")}</td><td><b>${escapeHtml(r.name)}</b></td><td>${r.scheduled}</td><td>${r.nonScheduled}</td><td>${r.scheduled+r.nonScheduled}</td><td>${r.productive}</td><td><span class="bp-pill ${bpClass(r.bp)}">${fmt(r.bp)}%</span></td></tr>`).join(""):`<tr><td colspan="8" class="empty">No matching salesman.</td></tr>`;
}
function renderTownCards(){
  const box=document.getElementById("townCards"); const rows=townSummary();
  box.innerHTML=rows.map(t=>`<div class="town-card"><h3>${escapeHtml(t.town)}</h3><div class="town-meta">${t.salesmen} salesman · ${t.outlets} outlets</div><div class="town-big">${fmt(t.bp)}% <small>Avg BP%</small></div><div class="town-line"><i style="width:${Math.min(t.bp,100)}%"></i></div><div class="town-meta">${t.productive} productive calls</div></div>`).join("")||'<div class="empty">No town data.</div>';
}
function openSalesmanProfile(id){
  const target=decodeURIComponent(id); selectedUser=data.find(r=>(r.code||r.name)===target)||data.find(r=>r.name===target); if(!selectedUser)return;
  document.getElementById("salesmanListWrap")?.classList.add("hidden");
  document.querySelector(".filter-bar")?.classList.add("hidden");
  document.getElementById("salesmanProfile").classList.remove("hidden");
  set("profileAvatar",initials(selectedUser.name));set("profileName",selectedUser.name);set("profileMeta",`${selectedUser.town} · ${selectedUser.code||"No code"}`);
  set("profileScheduled",selectedUser.scheduled);set("profileNonScheduled",selectedUser.nonScheduled);set("profileTotalOutlets",selectedUser.scheduled+selectedUser.nonScheduled);set("profileProductive",selectedUser.productive);set("profileBP",fmt(selectedUser.bp)+"%");
}
function closeSalesmanProfile(){
  document.getElementById("salesmanProfile").classList.add("hidden");
  document.querySelector(".filter-bar")?.classList.remove("hidden");
}
function showView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(view+"View").classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
  const titles={dashboard:["Salesman Productivity","Jhenaidah Territory · Executive overview"],salesman:["Salesman Report","Detailed salesman performance"],town:["Town Analysis","Town-level productivity comparison"],reports:["Reports Center","Upload, export and data controls"]};
  set("pageTitle",titles[view][0]);set("pageSubtitle",titles[view][1]);
  document.getElementById("sidebar").classList.remove("open");document.getElementById("overlay").classList.remove("show");
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-view-link]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.viewLink)));

document.getElementById("salesmanTownFilter").addEventListener("change",renderSalesmen);
document.getElementById("salesmanSearchBox").addEventListener("input",renderSalesmen);
document.getElementById("salesmanSort").addEventListener("change",renderSalesmen);

document.getElementById("openSidebar").onclick=()=>{document.getElementById("sidebar").classList.add("open");document.getElementById("overlay").classList.add("show")};
document.getElementById("closeSidebar").onclick=()=>{document.getElementById("sidebar").classList.remove("open");document.getElementById("overlay").classList.remove("show")};
document.getElementById("overlay").onclick=()=>document.getElementById("closeSidebar").click();

document.getElementById("themeToggle").onchange=e=>{document.body.classList.toggle("dark",e.target.checked);localStorage.setItem("dashboardDark",e.target.checked?"1":"0")};
if(localStorage.getItem("dashboardDark")==="1"){document.body.classList.add("dark");document.getElementById("themeToggle").checked=true}
document.getElementById("refreshBtn").onclick=()=>render();

document.getElementById("excelFile").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const buf=await file.arrayBuffer();
    let rows=[];
    if(file.name.toLowerCase().endsWith(".csv")){
      const text=new TextDecoder().decode(buf); rows=parseCSV(text);
    }else{
      const wb=XLSX.read(buf,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]];
      rows=XLSX.utils.sheet_to_json(ws,{defval:""});
    }
    const normalized=rows.map(normalizeRow).filter(r=>r.name&&r.name!=="Unknown");
    if(!normalized.length)throw new Error("No recognizable rows");
    data=normalized; localStorage.setItem("dashboardData",JSON.stringify(data)); render();
    alert(`Loaded ${data.length} salesman records.`);
  }catch(err){alert("Could not read this file. Please check the Excel headers and try again.");console.error(err)}
});

document.getElementById("exportBtn").onclick=exportCSV;
document.getElementById("reportExport").onclick=exportCSV;
document.getElementById("resetData").onclick=()=>{if(confirm("Reset dashboard and remove uploaded data?")){localStorage.removeItem("dashboardData");data=[];render();}};
function exportCSV(){
  if(!data.length)return alert("No data to export.");
  const rows=[["Town","Code","Salesman","Scheduled","Non Scheduled","Total Outlets","Productive Call","BP%"],...data.map(r=>[r.town,r.code,r.name,r.scheduled,r.nonScheduled,r.scheduled+r.nonScheduled,r.productive,fmt(r.bp)])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="Salesman_Productivity_Report.csv";a.click();URL.revokeObjectURL(a.href);
}
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(Boolean);if(!lines.length)return [];
  const headers=lines[0].split(",").map(x=>x.trim().replace(/^"|"$/g,""));
  return lines.slice(1).map(line=>{const vals=line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));const o={};headers.forEach((h,i)=>o[h]=vals[i]??"");return o});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function logout(){
  localStorage.removeItem("ofsRole");
  localStorage.removeItem("ofsUser");
  location.href="index.html";
}

// ==========================================
// ROLE-BASED UI (Uploader / Viewer)
// ==========================================

set("userBadge", (currentUser||"User") + (role==="viewer" ? " (Viewer)" : ""));
set("avatar", initials(currentUser||"U"));

if (role === "viewer") {

  // Viewer রা Upload/Reset করতে পারবে না
  document.getElementById("uploadWrap")?.style.setProperty("display","none");
  document.getElementById("uploadReportCard")?.style.setProperty("display","none");
  document.getElementById("resetReportCard")?.style.setProperty("display","none");
  document.getElementById("viewerBanner")?.style.setProperty("display","block");

} else {

  // Uploader রা Website Update বাটন দেখবে
  document.getElementById("exportJSONBtn")?.style.setProperty("display","inline-flex");
  document.getElementById("jsonReportCard")?.style.setProperty("display","block");

}

// ==========================================
// EXPORT report-data.json (for GitHub Pages / Viewers)
// ==========================================

function exportJSON(){
  if(!data.length) return alert("প্রথমে Excel Upload করুন, তারপর Export করুন।");
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="report-data.json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("report-data.json ডাউনলোড হয়়েছে।\n\nএই ফাইলটা প্রজেক্ট ফোল্ডারে বসিয়়ে GitHub-এ Commit + Push করুন — তাহলে Viewer-রা এই আপডেটেড রিপোর্ট দেখতে পাবে।");
}

document.getElementById("exportJSONBtn")?.addEventListener("click", exportJSON);
document.getElementById("reportExportJSON")?.addEventListener("click", exportJSON);

// ==========================================
// INITIAL DATA LOAD
// ==========================================

function loadInitialData(){

  if (role === "viewer") {

    fetch("report-data.json")
      .then(res => { if(!res.ok) throw new Error("no report file"); return res.json(); })
      .then(json => { data = Array.isArray(json) ? json : []; render(); })
      .catch(() => { data = []; render(); });

  } else {

    const saved = localStorage.getItem("dashboardData");
    try {
      data = saved ? JSON.parse(saved) : [];
    } catch {
      data = [];
    }
    render();

  }

}

loadInitialData();