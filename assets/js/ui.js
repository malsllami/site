function setText(id,t){ const e=document.getElementById(id); if(e) e.textContent=t; }
function setHtml(id,h){ const e=document.getElementById(id); if(e) e.innerHTML=h; }

function msg(type,text){
  const e=document.getElementById("msg");
  if(!e) return;
  if(!type){ e.textContent=""; e.className=""; return; }
  e.className="msg "+type;
  e.textContent=text;
}

function esc(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function badge(state){
  if(state==="نشطة") return '<span class="badge green">نشطة</span>';
  if(state==="مغلقة") return '<span class="badge gray">مغلقة</span>';
  return '<span class="badge pink">جديدة</span>';
}
