(async function(){
  try{
    const d = await get("قائمة الجمعيات");
    const arr = d.جمعيات || [];

    if(!arr.length){
      setHtml("societies", "<div class='warn warn-gray'>لا توجد جمعيات</div>");
      return;
    }

    setHtml("societies", arr.map(s => `
      <div class="soc" onclick="location.href='society.html?معرف=${escAttr(s.معرف)}'">
        <b>${esc(s.اسم)}</b>
        <div class="mt8">الحالة ${badge(s.حالة)}</div>
        <div class="mt8">عدد المشتركين ${esc(s.عدد_المشتركين)}</div>
        <div class="mt8">عدد الاسهم ${esc(s.عدد_الاسهم)}</div>
      </div>
    `).join(""));

  }catch(e){
    msg("err", e.message);
  }
})();

function escAttr(s){
  return encodeURIComponent(String(s || ""));
}
