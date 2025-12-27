// site/assets/js/pages/admin.js , انسخه واستبدله بالكامل
let adminToken = "";
let cachedSocieties = [];
let currentSocietyId = "";

let _currentSociety = null;
let _currentMembers = [];
let _currentMonthsKeys = [];
let _currentCollection = null;
let _currentDelivery = null;

function showMsg(type, text){
  msg(type, text);
}

function hide(el){ if(el) el.style.display = "none"; }
function show(el){ if(el) el.style.display = ""; }

function fmtNum(n){
  const x = Number(n || 0);
  if(!isFinite(x)) return "0";
  return (Math.round(x * 2) / 2).toString();
}

function sumArr(arr){
  return arr.reduce((s,x)=> s + Number(x||0), 0);
}

function calcMonthStatus(monthIndex, monthlyCollection, monthsTotals){
  const row = monthsTotals[monthIndex] || null;
  if(!row) return "month-ok";

  if(row.deliveryAmount > row.available) return "month-over";
  if(row.deliveryAmount === row.available) return "month-limit";
  if(row.ratio >= 0.75) return "month-near";
  return "month-ok";
}

function badgeHtml(state){
  return badge(state);
}

/* =========================
   تبويبات لوحة المدير الرئيسية
   ========================= */
function switchDashboardTab(tab, ev){
  document.querySelectorAll("#dashboard .tab").forEach(t=>t.classList.remove("active"));
  if(ev && ev.target) ev.target.classList.add("active");

  const a = document.getElementById("dash-societies");
  const b = document.getElementById("dash-members");

  if(a) a.style.display = (tab==="societies") ? "" : "none";
  if(b) b.style.display = (tab==="members") ? "" : "none";
}

/* =========================
   تبويبات داخل الجمعية
   ========================= */
function switchTab(tab, ev){
  document.querySelectorAll("#societyView .tab").forEach(t=>t.classList.remove("active"));
  if(ev && ev.target) ev.target.classList.add("active");

  const a = document.getElementById("tab-months");
  const b = document.getElementById("tab-members");
  const c = document.getElementById("tab-changes");
  const d = document.getElementById("tab-collection");
  const e = document.getElementById("tab-delivery");

  if(a) a.style.display = (tab==="months") ? "" : "none";
  if(b) b.style.display = (tab==="members") ? "" : "none";
  if(c) c.style.display = (tab==="changes") ? "" : "none";
  if(d) d.style.display = (tab==="collection") ? "" : "none";
  if(e) e.style.display = (tab==="delivery") ? "" : "none";
}

function backToDashboard(){
  currentSocietyId = "";
  _currentSociety = null;
  _currentMembers = [];
  _currentMonthsKeys = [];
  _currentCollection = null;
  _currentDelivery = null;

  show(document.getElementById("dashboard"));
  hide(document.getElementById("societyView"));
  showMsg("", "");
}

async function adminLogin(){
  showMsg("", "");
  const pin = (document.getElementById("adminPin").value || "").trim();
  if(!pin){
    showMsg("err", "رمز PIN مطلوب");
    return;
  }

  try{
    const data = await post({ action:"دخول بالرمز", رمز: pin });
    if(String(data.دور) !== "مدير"){
      showMsg("err", "هذا الرمز ليس لمدير");
      return;
    }

    حفظ_جلسة(data.token, "مدير");
    location.reload();

  }catch(e){
    showMsg("err", e.message || String(e));
  }
}

async function bootstrap(){
  const s = جلسة();
  adminToken = (s && s.token) ? s.token : "";

  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  if(!adminToken || s.role !== "مدير"){
    show(loginBox);
    hide(adminPanel);
    return;
  }

  hide(loginBox);
  show(adminPanel);

  // افتراضي, الجمعيات
  switchDashboardTab("societies", null);

  await loadAdminData();
}

async function loadAdminData(){
  showMsg("", "");

  try{
    const data = await get("معلومات مدير", { token: adminToken });
    cachedSocieties = data.جمعيات || [];
    renderSocieties(cachedSocieties);
    renderMembersCards(data.مشتركين || []);
  }catch(e){
    showMsg("err", e.message || String(e));
  }
}

function renderSocieties(arr){
  const box = document.getElementById("societiesAdmin");
  if(!box) return;

  if(!arr.length){
    box.innerHTML = `<div class="col-12"><div class="warn warn-gray">لا توجد جمعيات</div></div>`;
    return;
  }

  box.innerHTML = arr.map(s=>{
    const title = esc(s.اسم || "");
    const id = esc(s.معرف || "");
    const st = esc(s.تاريخ_البداية || "");
    const en = esc(s.تاريخ_النهاية || "");
    const members = esc(s.عدد_المشتركين || 0);
    const shares = esc(s.عدد_الاسهم || 0);
    const total = esc(s.اجمالي_القيمة || 0);

    return `
      <div class="col-4">
        <div class="soc">
          <div class="socTop" style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div style="font-weight:900">${title}</div>
            ${badgeHtml(s.حالة)}
          </div>
          <div class="socBody" style="margin-top:10px;line-height:1.9">
            <div>تاريخ البداية ${st}</div>
            <div>تاريخ النهاية ${en}</div>
            <div>عدد المشتركين ${members}</div>
            <div>عدد الاسهم ${shares}</div>
            <div>قيمة الجمعية الاجمالي ${total}</div>
          </div>
          <div class="socActions" style="margin-top:12px;display:flex;justify-content:flex-end">
            <button class="btn" onclick="openSociety('${id}')">فتح</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderMembersCards(arr){
  const box = document.getElementById("membersCards");
  if(!box) return;

  if(!arr.length){
    box.innerHTML = `<div class="col-12"><div class="warn warn-gray">لا يوجد مشتركين</div></div>`;
    return;
  }

  box.innerHTML = arr.map(u=>{
    const الاسم = esc(u.الاسم || "");
    const الجوال = esc(u.رقم_الجوال || "");
    const رمز = esc(u.رمز || "");
    const حالة = esc(u.حالة || "");
    return `
      <div class="col-4">
        <div class="soc" style="cursor:default">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div style="font-weight:900">${الاسم}</div>
            <span class="badge gray">${حالة || "نشط"}</span>
          </div>
          <div style="margin-top:10px;line-height:1.9">
            <div><span class="muted">رقم الجوال</span> <b>${الجوال}</b></div>
            <div><span class="muted">PIN</span> <span class="pillSmall" style="display:inline-block;border:1px solid #e6e6e6;border-radius:999px;padding:4px 10px;background:#fff"><b>${رمز}</b></span></div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function createSoc(){
  showMsg("", "");
  const name = (document.getElementById("socName").value || "").trim();
  const start = (document.getElementById("socStart").value || "").trim();

  if(!name){
    showMsg("err", "اسم الجمعية مطلوب");
    return;
  }
  if(!start){
    showMsg("err", "تاريخ البداية مطلوب");
    return;
  }

  try{
    await get("انشاء جمعية", {
      token: adminToken,
      اسم_الجمعية: name,
      تاريخ_البداية: start
    });

    showMsg("ok", "تم انشاء الجمعية بنجاح");
    document.getElementById("socName").value = "";
    document.getElementById("socStart").value = "";

    await loadAdminData();

  }catch(e){
    showMsg("err", e.message || String(e));
  }
}

function computeMonthsTotals(members, monthlyCollection){
  const months = 10;
  const totals = [];

  let surplusPrev = 0;
  for(let i=0;i<months;i++){
    const monthShares = members.reduce((s,m)=> s + Number((m.اشهر && m.اشهر[i]) ? m.اشهر[i] : 0), 0);
    const deliveryAmount = monthShares * 1000;
    const available = monthlyCollection + surplusPrev;
    const ratio = (available > 0) ? (deliveryAmount / available) : 0;
    const surplusEnd = available - deliveryAmount;

    totals.push({ monthShares, deliveryAmount, available, ratio, surplusEnd, surplusPrev });
    surplusPrev = surplusEnd;
  }
  return totals;
}

function buildMonthsCards(members, monthlyCollection, monthsTotals){
  const months = 10;

  const cards = [];
  for(let i=0;i<months;i++){
    const row = monthsTotals[i];
    const status = calcMonthStatus(i, monthlyCollection, monthsTotals);

    const monthNo = i + 1;
    const totalShares = row ? row.monthShares : 0;
    const deliveryAmount = row ? row.deliveryAmount : 0;
    const available = row ? row.available : 0;

    const card = document.createElement("div");
    card.className = `month-card ${status}`;
    card.innerHTML = `
      <div class="stripe"></div>
      <h4>شهر ${monthNo}</h4>
      <div class="meta">
        <div>إجمالي اسهم التسليم ${esc(fmtNum(totalShares))}</div>
        <div>مبلغ التسليم ${esc(Math.round(deliveryAmount))}</div>
        <div>الموجود ${esc(Math.round(available))}</div>
      </div>
    `;

    card.onclick = function(){
      const existing = card.querySelector(".accordion");
      if(existing){
        existing.remove();
        return;
      }

      const acc = document.createElement("div");
      acc.className = "accordion";

      members.forEach(m=>{
        const v = Number((m.اشهر && m.اشهر[i]) ? m.اشهر[i] : 0);
        if(v <= 0) return;

        const total = Number(m.عدد_الاسهم || 0);
        const usedTill = sumArr((m.اشهر || []).slice(0, i+1));
        const remaining = total - usedTill;

        acc.innerHTML += `
          <div class="accRow">
            <span><b>${esc(m.الاسم || "")}</b></span>
            <span>${esc(fmtNum(v))} سهم</span>
            <span class="pillSmall" style="display:inline-block;border:1px solid #e6e6e6;border-radius:999px;padding:4px 10px;background:#fff">المتبقي ${esc(fmtNum(remaining))}</span>
          </div>
        `;
      });

      if(!acc.innerHTML.trim()){
        acc.innerHTML = `<div class="warn warn-gray">لا يوجد تسليم في هذا الشهر</div>`;
      }

      card.appendChild(acc);
    };

    cards.push(card);
  }

  return cards;
}

function buildChangesTable(changes){
  if(!changes.length){
    return `<div class="warn warn-gray">لا توجد تغييرات</div>`;
  }

  const rows = changes.map(x=>{
    return `
      <tr>
        <td data-label="الاسم"><b>${esc(x.الاسم || "")}</b></td>
        <td data-label="الحالة">${esc(x.الحالة || "")}</td>
        <td data-label="تاريخ اول اشتراك">${esc(x.تاريخ_اول_اشتراك || "")}</td>
        <td data-label="تاريخ اخر تعديل">${esc(x.تاريخ_اخر_تعديل || "")}</td>
        <td data-label="اسهم بعد"><b>${esc(fmtNum(x.اسهم_بعد || 0))}</b></td>
      </tr>
    `;
  }).join("");

  return `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الحالة</th>
            <th>تاريخ اول اشتراك</th>
            <th>تاريخ اخر تعديل</th>
            <th>اسهم بعد</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildSocietyMembersCards(members, monthsKeys){
  const box = document.getElementById("societyMembersCards");
  if(!box) return;

  if(!members.length){
    box.innerHTML = `<div class="col-12"><div class="warn warn-gray">لا يوجد أعضاء في هذه الجمعية</div></div>`;
    return;
  }

  function monthLabel(yyyyMM){
    const v = String(yyyyMM || "").trim();
    if(!v) return "";
    const parts = v.split("-");
    if(parts.length !== 2) return v;
    const y = parts[0];
    const m = Number(parts[1]);
    const شهور = ["يناير","فبراير","مارس","ابريل","مايو","يونيو","يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"];
    if(m>=1 && m<=12) return شهور[m-1] + " " + y;
    return v;
  }

  box.innerHTML = members.map(m=>{
    const الاسم = esc(m.الاسم || "");
    const shares = esc(fmtNum(m.عدد_الاسهم || 0));

    const picks = [];
    const arr = (m.اشهر || []).slice(0,10);
    for(let i=0;i<arr.length;i++){
      const v = Number(arr[i] || 0);
      if(v > 0){
        const key = monthsKeys[i] || "";
        picks.push(monthLabel(key));
      }
    }

    const dates = picks.length ? picks.map(x=>`<span class="pillSmall" style="display:inline-block;border:1px solid #e6e6e6;border-radius:999px;padding:4px 10px;background:#fff;margin:4px 4px 0 0">${esc(x)}</span>`).join("") : `<span class="muted">لا يوجد</span>`;

    return `
      <div class="col-4">
        <div class="soc" style="cursor:default">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div style="font-weight:900">${الاسم}</div>
            <div><span class="muted">عدد الأسهم</span> <b>${shares}</b></div>
          </div>
          <div style="margin-top:10px">
            <div class="muted" style="font-weight:800">تواريخ الاستلام</div>
            <div style="margin-top:6px">${dates}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function fmtDateToday(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

/* =========================
   التحصيل UI
   ========================= */
function renderCollection(collection){
  const box = document.getElementById("collectionGrid");
  if(!box) return;

  const months = (collection && collection.اشهر) ? collection.اشهر : [];
  const monthlyAmount = Number(collection && collection.قيمة_التحصيل_للشهر ? collection.قيمة_التحصيل_للشهر : 0);

  if(!months.length){
    box.innerHTML = `<div class="warn warn-gray">لا توجد بيانات تحصيل</div>`;
    return;
  }

  function monthTitle(x){
    const key = String(x || "");
    const parts = key.split("-");
    if(parts.length !== 2) return key;
    const y = parts[0];
    const m = Number(parts[1]);
    const شهور = ["يناير","فبراير","مارس","ابريل","مايو","يونيو","يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"];
    if(m>=1 && m<=12) return شهور[m-1] + " " + y;
    return key;
  }

  const html = months.map((m, idx)=>{
    const monthNo = idx + 1;
    const rows = (m && m.صفوف) ? m.صفوف : [];

    const paidSum = rows.reduce((s,r)=> s + (r.تم_التحصيل ? Number(r.قيمة_التحصيل||0) : 0), 0);
    const allPaid = rows.length ? rows.every(r=> !!r.تم_التحصيل) : false;

    const cardStyle = allPaid ? "opacity:.85;filter:grayscale(1)" : "";
    const title = monthTitle(m.شهر_ميلادي || "");

    const tableRows = rows.map(r=>{
      const uid = esc(r.معرف_المستخدم || "");
      const name = esc(r.الاسم || "");
      const shares = esc(fmtNum(r.عدد_الاسهم || 0));
      const amount = esc(Math.round(Number(r.قيمة_التحصيل||0)));
      const checked = r.تم_التحصيل ? "checked" : "";
      const paidDate = esc(r.تاريخ_التحصيل || "");

      return `
        <tr>
          <td data-label="الاسم"><b>${name}</b></td>
          <td data-label="عدد الاسهم">${shares}</td>
          <td data-label="قيمة التحصيل">${amount}</td>
          <td data-label="تم التحصيل">
            <input type="checkbox" ${checked} onchange="toggleCollection('${esc(currentSocietyId)}', ${monthNo}, '${uid}', this.checked)">
          </td>
          <td data-label="تاريخ التحصيل">${paidDate || "-"}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="card" style="${cardStyle}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div style="font-weight:900">التحصيل, شهر ${monthNo}, ${esc(title)}</div>
          <span class="badge gray">قيمة التحصيل للشهر ${esc(Math.round(monthlyAmount))}</span>
        </div>

        <div class="mt12 tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>عدد الاسهم</th>
                <th>قيمة التحصيل</th>
                <th>تم التحصيل</th>
                <th>تاريخ التحصيل</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || `<tr><td colspan="5"><div class="warn warn-gray">لا يوجد مشتركين</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="align-end mt12">
          <div class="pillTitle">اجمالي ما تم تحصيله ${esc(Math.round(paidSum))}</div>
        </div>
      </div>
    `;
  }).join("");

  box.innerHTML = html;
}

let _collectionBusy = false;
async function toggleCollection(sid, monthNo, uid, isPaid){
  if(_collectionBusy) return;
  _collectionBusy = true;

  try{
    await get("تحديث التحصيل", {
      token: adminToken,
      معرف_الجمعية: sid,
      رقم_الشهر: String(monthNo),
      معرف_المستخدم: uid,
      تم_التحصيل: isPaid ? "1" : "0"
    });

    const data = await get("لوحة جمعية للمدير", { token: adminToken, معرف_الجمعية: sid });
    _currentCollection = data.تحصيل || null;
    renderCollection(_currentCollection);

  }catch(e){
    showMsg("err", e.message || String(e));
  }finally{
    _collectionBusy = false;
  }
}

/* =========================
   التسليم UI
   ========================= */
function renderDelivery(delivery){
  const box = document.getElementById("deliveryGrid");
  if(!box) return;

  const months = (delivery && delivery.اشهر) ? delivery.اشهر : [];

  if(!months.length){
    box.innerHTML = `<div class="warn warn-gray">لا توجد بيانات تسليم</div>`;
    return;
  }

  function monthTitle(x){
    const key = String(x || "");
    const parts = key.split("-");
    if(parts.length !== 2) return key;
    const y = parts[0];
    const m = Number(parts[1]);
    const شهور = ["يناير","فبراير","مارس","ابريل","مايو","يونيو","يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"];
    if(m>=1 && m<=12) return شهور[m-1] + " " + y;
    return key;
  }

  const html = months.map((m, idx)=>{
    const monthNo = idx + 1;
    const rows = (m && m.صفوف) ? m.صفوف : [];

    const deliveredSum = rows.reduce((s,r)=> s + (r.تم_التسليم ? Number(r.قيمة_التسليم||0) : 0), 0);
    const allDelivered = rows.length ? rows.every(r=> !!r.تم_التسليم) : true;

    const cardStyle = allDelivered ? "opacity:.85;filter:grayscale(1)" : "";
    const title = monthTitle(m.شهر_ميلادي || "");

    const meta = `
      <div class="grid mt12">
        <div class="col-6"><span class="labelPill">الموجود</span> <div class="mt8"><b>${esc(Math.round(Number(m.الموجود||0)))}</b></div></div>
        <div class="col-6"><span class="labelPill">الفائض السابق</span> <div class="mt8"><b>${esc(Math.round(Number(m.فائض_سابق||0)))}</b></div></div>
        <div class="col-6"><span class="labelPill">اجمالي التسليم المطلوب</span> <div class="mt8"><b>${esc(Math.round(Number(m.اجمالي_التسليم||0)))}</b></div></div>
        <div class="col-6"><span class="labelPill">الفائض بعد التسليم</span> <div class="mt8"><b>${esc(Math.round(Number(m.فائض_بعد||0)))}</b></div></div>
        <div class="col-12"><span class="labelPill">عدد الاسهم المسلمة في هذا الشهر</span> <div class="mt8"><b>${esc(fmtNum(Number(m.اجمالي_اسهم_التسليم||0)))}</b></div></div>
      </div>
    `;

    const tableRows = rows.map(r=>{
      const uid = esc(r.معرف_المستخدم || "");
      const name = esc(r.الاسم || "");
      const shares = esc(fmtNum(r.اسهم_هذا_الشهر || 0));
      const amount = esc(Math.round(Number(r.قيمة_التسليم||0)));
      const checked = r.تم_التسليم ? "checked" : "";
      const delDate = esc(r.تاريخ_التسليم || "");

      return `
        <tr>
          <td data-label="الاسم"><b>${name}</b></td>
          <td data-label="اسهم هذا الشهر">${shares}</td>
          <td data-label="قيمة التسليم">${amount}</td>
          <td data-label="تم التسليم">
            <input type="checkbox" ${checked} onchange="toggleDelivery('${esc(currentSocietyId)}', ${monthNo}, '${uid}', this.checked)">
          </td>
          <td data-label="تاريخ التسليم">${delDate || "-"}</td>
        </tr>
      `;
    }).join("");

    const noRows = !rows.length ? `<div class="warn warn-gray mt12">لا يوجد تسليم في هذا الشهر</div>` : "";

    return `
      <div class="card" style="${cardStyle}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div style="font-weight:900">التسليم, شهر ${monthNo}, ${esc(title)}</div>
          <span class="badge gray">اجمالي تم تسليمه ${esc(Math.round(deliveredSum))}</span>
        </div>

        ${meta}

        ${noRows ? noRows : `
          <div class="mt12 tableWrap">
            <table class="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>اسهم هذا الشهر</th>
                  <th>قيمة التسليم</th>
                  <th>تم التسليم</th>
                  <th>تاريخ التسليم</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        `}

        <div class="align-end mt12">
          <div class="pillTitle">اجمالي التسليم ${esc(Math.round(Number(m.اجمالي_التسليم||0)))}</div>
        </div>
      </div>
    `;
  }).join("");

  box.innerHTML = html;
}

let _deliveryBusy = false;
async function toggleDelivery(sid, monthNo, uid, isDelivered){
  if(_deliveryBusy) return;
  _deliveryBusy = true;

  try{
    await get("تحديث التسليم", {
      token: adminToken,
      معرف_الجمعية: sid,
      رقم_الشهر: String(monthNo),
      معرف_المستخدم: uid,
      تم_التسليم: isDelivered ? "1" : "0"
    });

    const data = await get("لوحة جمعية للمدير", { token: adminToken, معرف_الجمعية: sid });
    _currentDelivery = data.تسليم || null;
    renderDelivery(_currentDelivery);

  }catch(e){
    showMsg("err", e.message || String(e));
  }finally{
    _deliveryBusy = false;
  }
}

async function openSociety(id){
  showMsg("", "");
  currentSocietyId = id;

  try{
    const data = await get("لوحة جمعية للمدير", { token: adminToken, معرف_الجمعية: id });

    const soc = data.جمعية || {};
    const members = data.اعضاء || [];
    const changes = data.تغييرات || [];
    const monthsKeys = data.اشهر_مفاتيح || [];

    _currentSociety = soc;
    _currentMembers = members;
    _currentMonthsKeys = monthsKeys;
    _currentCollection = data.تحصيل || null;
    _currentDelivery = data.تسليم || null;

    const title = `${soc.اسم || "جمعية"}  ${badgeHtml(soc.حالة)}`;
    document.getElementById("societyTitle").innerHTML = title;

    const monthlyCollection = Number(soc.عدد_الاسهم || 0) * 100;

    document.getElementById("societyMeta").innerHTML = `
      <div class="grid">
        <div class="col-6"><span class="labelPill">تاريخ البداية</span> <div class="mt8"><b>${esc(soc.تاريخ_البداية || "")}</b></div></div>
        <div class="col-6"><span class="labelPill">تاريخ النهاية</span> <div class="mt8"><b>${esc(soc.تاريخ_النهاية || "")}</b></div></div>
        <div class="col-6"><span class="labelPill">عدد المشتركين</span> <div class="mt8"><b>${esc(soc.عدد_المشتركين || 0)}</b></div></div>
        <div class="col-6"><span class="labelPill">عدد الاسهم</span> <div class="mt8"><b>${esc(fmtNum(soc.عدد_الاسهم || 0))}</b></div></div>
        <div class="col-12"><span class="labelPill">التحصيل الشهري</span> <div class="mt8"><b>${esc(Math.round(monthlyCollection))}</b></div></div>
      </div>
    `;

    const monthsTotals = computeMonthsTotals(members, monthlyCollection);
    const monthsGrid = document.getElementById("monthsGrid");
    monthsGrid.innerHTML = "";
    const cards = buildMonthsCards(members, monthlyCollection, monthsTotals);
    cards.forEach(c=> monthsGrid.appendChild(c));

    buildSocietyMembersCards(members, monthsKeys);
    document.getElementById("societyChangesTable").innerHTML = buildChangesTable(changes);

    renderCollection(_currentCollection);
    renderDelivery(_currentDelivery);

    hide(document.getElementById("dashboard"));
    show(document.getElementById("societyView"));

    document.querySelectorAll("#societyView .tab").forEach(t=>t.classList.remove("active"));
    const firstTab = document.querySelector("#societyView .tab");
    if(firstTab) firstTab.classList.add("active");
    switchTab("months", null);

  }catch(e){
    showMsg("err", e.message || String(e));
  }
}

(function(){
  bootstrap();
})();
