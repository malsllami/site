window._sid = "";

(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }

  document.getElementById("navLogout").style.display = "";

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

    renderCollectionCards(d);
    renderDeliveryCards(d);

  }catch(e){
    msg("err", e.message);
  }
}

function renderCollectionCards(d){
  const months = (d.تحصيل && d.تحصيل.اشهر) ? d.تحصيل.اشهر : [];
  if(!months.length){
    setHtml("collectionArea", "<div class='warn warn-gray'>لا يوجد بيانات</div>");
    return;
  }

  const html = months.map(m => {
    const memberCards = (m.صفوف || []).map(r => `
      <div class="memberCard">
        <div class="row2">
          <div>
            <div class="name">${esc(r.الاسم)}</div>
            <div class="small">الاسهم ${esc(r.عدد_الاسهم)} , قيمة التحصيل ${esc(r.قيمة_التحصيل)}</div>
            <div class="small">تاريخ ${esc(r.تاريخ_التحصيل || "")}</div>
          </div>
          <div class="controls">
            <label class="small">
              <input type="checkbox" ${r.تم_التحصيل ? "checked" : ""} onchange="toggleCollect('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
              تم
            </label>
          </div>
        </div>
      </div>
    `).join("");

    return `
      <div class="cardItem monthCard">
        <div class="titleRow">
          <b>التحصيل الشهر ${esc(m.رقم_الشهر)} , ${esc(m.شهر_ميلادي)}</b>
          <span class="pill">قيمة التحصيل للشهر ${esc(d.تحصيل.قيمة_التحصيل_للشهر || "")}</span>
        </div>
        <div class="memberCards">${memberCards || "<div class='warn warn-gray'>لا يوجد</div>"}</div>
      </div>
    `;
  }).join("");

  setHtml("collectionArea", html);
}

function renderDeliveryCards(d){
  const months = (d.تسليم && d.تسليم.اشهر) ? d.تسليم.اشهر : [];
  if(!months.length){
    setHtml("deliveryArea", "<div class='warn warn-gray'>لا يوجد بيانات</div>");
    return;
  }

  const html = months.map(m => {
    const onlyReceivers = (m.صفوف || []).filter(r => Number(r.اسهم_هذا_الشهر || 0) > 0);

    const memberCards = onlyReceivers.map(r => `
      <div class="memberCard">
        <div class="row2">
          <div>
            <div class="name">${esc(r.الاسم)}</div>
            <div class="small">اسهم هذا الشهر ${esc(r.اسهم_هذا_الشهر)} , قيمة التسليم ${esc(r.قيمة_التسليم)}</div>
            <div class="small">تاريخ ${esc(r.تاريخ_التسليم || "")}</div>
          </div>
          <div class="controls">
            <label class="small">
              <input type="checkbox" ${r.تم_التسليم ? "checked" : ""} onchange="toggleDeliver('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
              تم
            </label>
          </div>
        </div>
      </div>
    `).join("");

    return `
      <div class="cardItem monthCard">
        <div class="titleRow">
          <b>التسليم الشهر ${esc(m.رقم_الشهر)} , ${esc(m.شهر_ميلادي)}</b>
          <span class="pill">اسهم التسليم ${esc(m.اجمالي_اسهم_التسليم || 0)}</span>
        </div>

        <div class="pills">
          <span class="pill">الموجود ${esc(m.الموجود)}</span>
          <span class="pill">فائض سابق ${esc(m.فائض_سابق)}</span>
          <span class="pill">اجمالي التسليم ${esc(m.اجمالي_التسليم)}</span>
          <span class="pill">فائض بعد ${esc(m.فائض_بعد)}</span>
        </div>

        <div class="memberCards">${memberCards || "<div class='warn warn-gray'>لا يوجد مستلمين في هذا الشهر</div>"}</div>
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
