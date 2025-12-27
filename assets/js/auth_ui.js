function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function setHtml(id, html){
  const el = document.getElementById(id);
  if(el) el.innerHTML = html;
}

function setText(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

function msg(type, text){
  const el = document.getElementById("msg");
  if(!el) return;
  if(!text){
    el.innerHTML = "";
    return;
  }
  const cls = type === "ok" ? "ok" : "err";
  el.innerHTML = `<div class="${cls}">${esc(text)}</div>`;
}

function badge(state){
  const s = String(state || "");
  if(s === "جديدة") return `<span class="badge b1">جديدة</span>`;
  if(s === "نشطة") return `<span class="badge b2">نشطة</span>`;
  if(s === "مغلقة") return `<span class="badge b3">مغلقة</span>`;
  return `<span class="badge b0">${esc(s)}</span>`;
}

function q(name){
  const url = new URL(location.href);
  return url.searchParams.get(name) || "";
}
