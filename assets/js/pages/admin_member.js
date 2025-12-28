window._sid = "";
window._dash = null;

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
  showSection("members");
})();

function showSection(name){
  const secMembers = document.getElementById("secMembers");
  const secCollection = document.getElementById("secCollection");
  const secDelivery = document.getElementById("secDelivery");

  if(secMembers) secMembers.style.display = (name === "members") ? "" : "none";
  if(secCollection) secCollection.style.display = (name === "collection") ? "" : "none";
  if(secDelivery) secDelivery.style.display = (name === "delivery") ? "" : "none";

  const b1 = document.getElementById("tabMembers");
  const b2 = document.getElementById("tabCollection");
  const b3 = document.getElementById("tabDelivery");

  if(b1) b1.className = (name === "members") ? "btn" : "btn btn2";
  if(b2) b2.className = (name === "collection") ? "btn" : "btn btn2";
  if(b3) b3.className = (name === "delivery") ? "btn" : "btn btn2";
}

async function loadDashboard(){
  const s = جلسة();
  msg("", "");

  try{
    const d = await get("لوحة جمعية للمدير", { token: s.token, معرف_الجمعية: window._sid });
    window._dash = d;

    const soc = d.جمعية;

    setHtml("socInfo",
      `<div class="kv"><div class="k">اسم الجمعية</div><div class="v">${esc(soc.اسم)}</div></div>
       <div class="kv"><div class="k">الحالة</div><div class="v">${badge(soc.حالة)}</div></div>
       <div class="kv"><div class="k">البداية</div><div class="v">${esc(soc.تاريخ_البداية)}</div></div>
       <div class="kv"><div class="k">النهاية</div><div class="v">${esc(soc.تاريخ_النهاية)}</div></div>
       <div class="kv"><div class="k">عدد الاسهم</div><div class="v">${esc(soc.عدد_الاسهم)}</div></div>`
    );

    renderMembers(d);
    renderCollection(d);
    renderDelivery(d);

  }catch(e){
    msg("err", e.message);
  }
}

function renderMembers(d){
  const اعض = d.اعضاء || [];
  if(!membersHasDom()){
    return;
  }

  if(!عظ(اعض)){
    setHtml("membersArea", "<div class='warn warn-gray'>لا يوجد مشتركين</div>");
    return;
  }

  const html = اعض.map(m=>{
    const months = Array.isArray(m.اشهر) ? m.اشهر : [];
    const lines = months.map((v, idx)=>{
      const vv = Number(v || 0);
      if(!(vv > 0)) return "";
      return `<div class="small mt6">شهر ${idx + 1} اسهم ${esc(vv)}</div>`;
    }).filter(x=>x).join("");

    return `
      <div class="soc">
        <b>${esc(m.الاسم)}</b>
        <div class="mt8">عدد الاسهم ${esc(m.عدد_الاسهم)}</div>
        <div class="mt8">اجمالي رغباته ${esc(m.اجمالي)}</div>
        ${lines ? `<div class="mt8">${lines}</div>` : `<div class="small mt8">لا توجد رغبات محفوظة</div>`}
      </div>
    `;
  }).join("");

  setHtml("membersArea", html);
}

function membersHasDom(){
  return !!document.getElementById("membersArea");
}

function عظ(arr){
  return Array.isArray(arr) && arr.length > 0;
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
        <div class="soc" style="margin-top:10px">
          <b>${esc(r.الاسم)}</b>
          <div class="mt8">الاسهم ${esc(r.عدد_الاسهم)}</div>
          <div class="mt8">قيمة التحصيل ${esc(r.قيمة_التحصيل)}</div>
          <div class="mt8">
            <label class="small">
              <input type="checkbox" ${checked} onchange="toggleCollect('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
              تم التحصيل
            </label>
          </div>
          <div class="small mt8">${esc(r.تاريخ_التحصيل || "")}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="soc">
        <b>الشهر ${esc(m.رقم_الشهر)} ${esc(m.شهر_ميلادي)}</b>
        <div class="small mt8">قيمة التحصيل للشهر ${esc(d.تحصيل.قيمة_التحصيل_للشهر || "")}</div>
        <div class="mt12">${rows || "<div class='warn warn-gray'>لا يوجد</div>"}</div>
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
        <div class="soc" style="margin-top:10px">
          <b>${esc(r.الاسم)}</b>
          <div class="mt8">اسهم هذا الشهر ${esc(r.اسهم_هذا_الشهر)}</div>
          <div class="mt8">قيمة التسليم ${esc(r.قيمة_التسليم)}</div>
          <div class="mt8">
            <label class="small">
              <input type="checkbox" ${checked} onchange="toggleDeliver('${esc(m.رقم_الشهر)}','${esc(r.معرف_المستخدم)}',this.checked)">
              تم التسليم
            </label>
          </div>
          <div class="small mt8">${esc(r.تاريخ_التسليم || "")}</div>
        </div>
      `;
    }).join("");

    const summary = `
      <div class="small mt8">
        الموجود ${esc(m.الموجود)} , فائض سابق ${esc(m.فائض_سابق)} , اجمالي التسليم ${esc(m.اجمالي_التسليم)} , فائض بعد ${esc(m.فائض_بعد)}
      </div>
    `;

    return `
      <div class="soc">
        <b>الشهر ${esc(m.رقم_الشهر)} ${esc(m.شهر_ميلادي)}</b>
        ${summary}
        <div class="mt12">${rows || "<div class='warn warn-gray'>لا يوجد مستلمين لهذا الشهر</div>"}</div>
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
