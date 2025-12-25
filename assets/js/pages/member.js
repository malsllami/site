document.getElementById("logout").addEventListener("click", function(e){
  e.preventDefault();
  خروج();
});

(async function(){
  const s = جلسة();
  if(!s.token || s.role!=="مشترك"){
    location.href="register.html";
    return;
  }

  try{
    const info = await get("معلومات مشترك", { token:s.token });
    const u = info.مستخدم;

    setHtml("info",
      "الاسم <b>" + esc(u.الاسم) + "</b><br>" +
      "رقم الجوال <b>" + esc(u.رقم_الجوال) + "</b>"
    );

    const subs = await get("جمعيات المشترك", { token:s.token });
    const arr = subs.اشتراكات || [];

    if(!arr.length){
      setHtml("societies","لا توجد جمعيات مشترك بها");
      return;
    }

    const cards = arr.map(x=>{
      return `<div class="col-4">
        <div class="soc" onclick="location.href='society.html?معرف=${encodeURIComponent(x.معرف_الجمعية)}'">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <b>${esc(x.اسم_الجمعية)}</b>
            ${badge(x.حالة)}
          </div>
          <div style="margin-top:8px">عدد الاسهم ${esc(x.عدد_الاسهم||0)}</div>
          <div>تاريخ البداية ${esc(x.تاريخ_البداية||"")}</div>
          <div>تاريخ النهاية ${esc(x.تاريخ_النهاية||"")}</div>
        </div>
      </div>`;
    }).join("");

    setHtml("societies", `<div class="grid">${cards}</div>`);
  }catch(e){
    msg("err", e.message);
  }
})();
