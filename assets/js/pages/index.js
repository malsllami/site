(async function(){
  try{
    auth_ui();

    const data = await get("قائمة الجمعيات");
    const list = (data.جمعيات || []);

    if(!list.length){
      setHtml("societies", "<div class='warn warn-gray'>لا توجد جمعيات</div>");
      return;
    }

    setHtml("societies", list.map(s => `
      <div class="soc" onclick="location.href='society.html?معرف=${encodeURIComponent(s.معرف)}'">
        <b>${esc(s.اسم)}</b>
        <div class="mt8">الحالة ${badge(s.حالة)}</div>
        <div class="mt8">عدد المشتركين ${esc(s.عدد_المشتركين || 0)}</div>
        <div class="mt8">عدد الاسهم ${esc(s.عدد_الاسهم || 0)}</div>
      </div>
    `).join(""));
  }catch(e){
    msg("err", e.message || "خطأ غير معروف");
  }
})();
