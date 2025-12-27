(async function(){
  document.title = "صفحتي";

  const s = جلسة();
  if(!s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  try{
    // بيانات المشترك
    const data = await get("معلومات مشترك", { token: s.token });
    const u = data.مستخدم;

    setHtml("info",
      `<div class="kv">
        <div class="k">الاسم</div><div class="v">${esc(u.الاسم)}</div>
      </div>
      <div class="kv">
        <div class="k">رقم الجوال</div><div class="v">${esc(u.رقم_الجوال)}</div>
      </div>`
    );

    // جمعيات المشترك
    const data2 = await get("جمعيات المشترك", { token: s.token });
    const arr = data2.اشتراكات || [];

    const subscribedIds = new Set(arr.map(x=>String(x.معرف_الجمعية||"")));

    if(!arr.length){
      setHtml("mySocieties", "<div class='warn warn-gray'>لا توجد جمعيات مشترك بها</div>");
    }else{
      setHtml("mySocieties", `
        <div class="tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th>اسم الجمعية</th>
                <th>الحالة</th>
                <th>عدد الاسهم</th>
                <th>بداية</th>
                <th>نهاية</th>
                <th>فتح</th>
              </tr>
            </thead>
            <tbody>
              ${arr.map(x=>`
                <tr>
                  <td data-label="اسم الجمعية">${esc(x.اسم_الجمعية)}</td>
                  <td data-label="الحالة">${esc(x.حالة)}</td>
                  <td data-label="عدد الاسهم"><b>${esc(x.عدد_الاسهم)}</b></td>
                  <td data-label="بداية">${esc(x.تاريخ_البداية||"")}</td>
                  <td data-label="نهاية">${esc(x.تاريخ_النهاية||"")}</td>
                  <td data-label="فتح">
                    <button class="btn btn2" onclick="location.href='society.html?معرف=${encodeURIComponent(x.معرف_الجمعية)}'">فتح</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `);
    }

    // الجمعيات الجديدة المتاحة للتسجيل
    const all = await get("قائمة الجمعيات");
    const societies = all.جمعيات || [];
    const available = societies.filter(soc => String(soc.حالة)==="جديدة" && !subscribedIds.has(String(soc.معرف)));

    if(!available.length){
      setHtml("availableSocieties", "<div class='warn warn-gray'>لا توجد جمعيات جديدة متاحة حاليا</div>");
    }else{
      setHtml("availableSocieties", `
        <div class="grid">
          ${available.map(soc=>`
            <div class="col-4">
              <div class="soc" onclick="location.href='society.html?معرف=${encodeURIComponent(soc.معرف)}'">
                <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
                  <b>${esc(soc.اسم)}</b>
                  ${badge(soc.حالة)}
                </div>
                <div style="margin-top:8px">تاريخ البداية ${esc(soc.تاريخ_البداية||"")}</div>
                <div>تاريخ النهاية ${esc(soc.تاريخ_النهاية||"")}</div>
                <div>عدد المشتركين ${esc(soc.عدد_المشتركين||0)}</div>
                <div>عدد الاسهم ${esc(soc.عدد_الاسهم||0)}</div>
                <div>قيمة الجمعية الاجمالي ${esc(soc.اجمالي_القيمة||0)}</div>
                <div style="margin-top:8px;color:#0e6f7f;font-weight:800">اضغط للتسجيل</div>
              </div>
            </div>
          `).join("")}
        </div>
      `);
    }

  }catch(e){
    msg("err", e.message);
  }
})();

let _mobileBusy = false;

async function saveMobile(){
  if(_mobileBusy) return;
  _mobileBusy = true;

  const btn = document.getElementById("btnSaveMobile");
  if(btn){
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.pointerEvents = "none";
  }

  msg("", "");

  try{
    const s = جلسة();
    const رقم_الجوال = document.getElementById("newMobile").value.trim();
    if(!رقم_الجوال){
      msg("err","رقم الجوال مطلوب");
      return;
    }
    await get("تحديث رقم الجوال", { token: s.token, رقم_الجوال });
    msg("ok","تم تحديث رقم الجوال");
    setTimeout(()=>location.reload(), 700);
  }catch(e){
    msg("err", e.message || String(e));
  }finally{
    if(btn){
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
    _mobileBusy = false;
  }
}
