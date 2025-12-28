(function(){
  loadSocieties();
})();

function escAttr(v){
  return encodeURIComponent(String(v || ""));
}

async function loadSocieties(){
  msg("", "");

  try{
    const data = await get("قائمة الجمعيات");
    const arr = (data && data.جمعيات) ? data.جمعيات : [];

    if(!arr.length){
      setHtml("societies", "<div class='warn warn-gray'>لا توجد جمعيات</div>");
      return;
    }

    setHtml("societies", arr.map(s => `
      <div class="soc" onclick="location.href='society.html?معرف=${escAttr(s.معرف)}'">
        <b>${esc(s.اسم || "")}</b>
        <div class="mt8">الحالة ${badge(s.حالة || "")}</div>
        <div class="mt8">عدد المشتركين ${esc(s.عدد_المشتركين || 0)}</div>
        <div class="mt8">عدد الاسهم ${esc(s.عدد_الاسهم || 0)}</div>
      </div>
    `).join(""));

  }catch(e){
    msg("err", e.message || String(e));
  }
}
