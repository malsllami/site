window._sid = "";

(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }

  const sid = q("معرف") || "";
  if(!sid){
    msg("err", "معرف الجمعية غير موجود بالرابط");
    return;
  }
  window._sid = sid;

  await loadDashboard();
})();

async function loadDashboard(){
  const s = جلسة();
  msg("", "");

  try{
    const d = await get("لوحة جمعية للمدير", { token: s.token, معرف_الجمعية: window._sid });
    const soc = d.جمعية;

    setHtml("socInfo",
      `<div class="kv"><div class="k">اسم الجمعية</div><div class="v">${esc(soc.اسم)}</div></div>
       <div class="kv"><div class="k">الحالة</div><div class="v">${badge(soc.حالة)}</div></div>
       <div class="kv"><div class="k">البداية</div><div class="v">${esc(soc.تاريخ_البداية)}</div></div>
       <div class="kv"><div class="k">النهاية</div><div class="v">${esc(soc.تاريخ_النهاية)}</div></div>
       <div class="kv"><div class="k">عدد الاسهم</div><div class="v">${esc(soc.عدد_الاسهم)}</div></div>`
    );

    renderCollection(d);
    renderDelivery(d);

  }catch(e){
    msg("err", e.message);
  }
}

function renderCollection(d){
  const months = (d.تحصيل && d.تحصيل.اشهر) ? d.تحصيل.اشهر : [];
  if(!months.length){
    setHtml("collectionArea", "<div class='warn warn-gray'>لا يوجد بيانات</div>");
    return;
  }

  const html = months.map(m => {
    const rows = (m.صفوف || []).map(r => {
      const checked = r.تم_التحصيل ? "checked" : "";
      return `
        <tr>
          <td>${esc(r.الاسم)}</td>
          <td>${esc(r.عدد_الاسهم)}</td>
          <td>${esc(r.قيمة_التحصيل)}</td>
          <td>
            <input type="checkbox" ${checked} onchange="toggleCollect('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
          </td>
          <td>${esc(r.تاريخ_التحصيل || "")}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="soc">
        <b>الشهر ${esc(m.رقم_الشهر)} , ${esc(m.شهر_ميلادي)}</b>
        <table class="table mt12">
          <thead>
            <tr>
              <th>المشترك</th>
              <th>الاسهم</th>
              <th>قيمة التحصيل</th>
              <th>تم التحصيل</th>
              <th>تاريخ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  setHtml("collectionArea", html);
}

function renderDelivery(d){
  const months = (d.تسليم && d.تسليم.اشهر) ? d.تسليم.اشهر : [];
  if(!months.length){
    setHtml("deliveryArea", "<div class='warn warn-gray'>لا يوجد بيانات</div>");
    return;
  }

  const html = months.map(m => {
    const rows = (m.صفوف || []).map(r => {
      const checked = r.تم_التسليم ? "checked" : "";
      return `
        <tr>
          <td>${esc(r.الاسم)}</td>
          <td>${esc(r.اسهم_هذا_الشهر)}</td>
          <td>${esc(r.قيمة_التسليم)}</td>
          <td>
            <input type="checkbox" ${checked} onchange="toggleDeliver('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
          </td>
          <td>${esc(r.تاريخ_التسليم || "")}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="soc">
        <b>الشهر ${esc(m.رقم_الشهر)} , ${esc(m.شهر_ميلادي)}</b>
        <div class="small mt8">
          الموجود ${esc(m.الموجود)} , فائض سابق ${esc(m.فائض_سابق)} , اجمالي التسليم ${esc(m.اجمالي_التسليم)} , فائض بعد ${esc(m.فائض_بعد)}
        </div>
        <table class="table mt12">
          <thead>
            <tr>
              <th>المشترك</th>
              <th>اسهم هذا الشهر</th>
              <th>قيمة التسليم</th>
              <th>تم التسليم</th>
              <th>تاريخ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  setHtml("deliveryArea", html);
}

async function toggleCollect(monthNo, uid, on){
  const s = جلسة();
  msg("", "");
  try{
    await post({
      action: "تحديث التحصيل",
      token: s.token,
      معرف_الجمعية: window._sid,
      رقم_الشهر: String(monthNo),
      معرف_المستخدم: String(uid),
      تم_التحصيل: on ? "1" : "0"
    });
  }catch(e){
    msg("err", e.message);
    await loadDashboard();
  }
}

async function toggleDeliver(monthNo, uid, on){
  const s = جلسة();
  msg("", "");
  try{
    await post({
      action: "تحديث التسليم",
      token: s.token,
      معرف_الجمعية: window._sid,
      رقم_الشهر: String(monthNo),
      معرف_المستخدم: String(uid),
      تم_التسليم: on ? "1" : "0"
    });
  }catch(e){
    msg("err", e.message);
    await loadDashboard();
  }
}
