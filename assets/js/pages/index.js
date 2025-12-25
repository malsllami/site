(async function(){
  setText("welcome", CONFIG.WELCOME_TEXT);

  try{
    const data = await get("قائمة الجمعيات");
    const arr = data.جمعيات || [];

    if(!arr.length){
      setHtml("societies","<div class='col-12'>لا توجد جمعيات</div>");
      return;
    }

    setHtml("societies", arr.map(s=>{
      return `<div class="col-4">
        <div class="soc" onclick="location.href='society.html?معرف=${encodeURIComponent(s.معرف)}'">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <b>${esc(s.اسم)}</b>
            ${badge(s.حالة)}
          </div>
          <div style="margin-top:8px">تاريخ البداية ${esc(s.تاريخ_البداية||"")}</div>
          <div>تاريخ النهاية ${esc(s.تاريخ_النهاية||"")}</div>
          <div>عدد المشتركين ${esc(s.عدد_المشتركين||0)}</div>
          <div>عدد الاسهم ${esc(s.عدد_الاسهم||0)}</div>
          <div>قيمة الجمعية الاجمالي ${esc(s.اجمالي_القيمة||0)}</div>
          ${s.حالة==="جديدة" ? "<div style='margin-top:8px;color:#a11757;font-weight:800'>بادر بالتسجيل</div>" : ""}
        </div>
      </div>`;
    }).join(""));
  }catch(e){
    msg("err", e.message);
  }
})();
