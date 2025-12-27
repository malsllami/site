// assets/js/ui.js , انسخه واستبدله بالكامل
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

/* قائمة الجوال */
function toggleMobileMenu(){
  const m = document.getElementById("mobileMenu");
  if(!m) return;

  const isOpen = m.classList.contains("open");
  if(isOpen) m.classList.remove("open");
  else m.classList.add("open");
}

/* نسخ عام */
function copyText(id){
  const e = document.getElementById(id);
  if(!e) return;
  const t = (e.textContent || "").trim();
  if(!t) return;

  navigator.clipboard.writeText(t).then(()=>{
    msg("ok","تم النسخ");
  }).catch(()=>{
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand("copy"); }catch(_e){}
    ta.remove();
    msg("ok","تم النسخ");
  });
}

/* بنك, شاشة التواصل */
function toggleBank(){
  const b = document.getElementById("bankBox");
  if(!b) return;
  b.style.display = (b.style.display === "none" || !b.style.display) ? "" : "none";
}
