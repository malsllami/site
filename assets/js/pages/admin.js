// site/assets/js/pages/admin.js  (استبدله بالكامل)
let adminToken = "";
let cachedSocieties = [];
let currentSocietyId = "";

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
  return arr.reduce((s, x) => s + Number(x || 0), 0);
}

function calcMonthStatus(monthIndex, monthsTotals){
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

function switchTab(tab, ev){
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  if(ev && ev.target) ev.target.classList.add("active");

  const a = document.getElementById("tab-months");
  const b = document.getElementById("tab-members");
  const c = document.getElementById("tab-changes");

  if(a) a.style.display = (tab === "months") ? "" : "none";
  if(b) b.style.display = (tab === "members") ? "" : "none";
  if(c) c.style.display = (tab === "changes") ? "" : "none";
}

function backToDashboard(){
  currentSocietyId = "";
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

  await loadAdminData();
}

async function loadAdminData(){
  showMsg("", "");

  try{
    const data = await get("معلومات مدير", { token: adminToken });
    cachedSocieties = data.جمعيات || [];
    renderSocieties(cachedSocieties);
    renderMembers(data.مشتركين || []);
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

  box.innerHTML = arr.map(s => {
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
          <div class="socTop">
            <div style="font-weight:900">${title}</div>
            ${badgeHtml(s.حالة)}
          </div>
          <div class="socBody">
            <div>تاريخ البداية ${st}</div>
            <div>تاريخ النهاية ${en}</div>
            <div>عدد المشتركين ${members}</div>
            <div>عدد الاسهم ${shares}</div>
            <div>قيمة الجمعية الاجمالي ${total}</div>
          </div>
          <div class="socActions">
            <button class="btn" onclick="openSociety('${id}')">فتح</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderMembers(arr){
  const box = document.getElementById("members");
  if(!box) return;

  if(!arr.length){
    box.innerHTML = `<div class="warn warn-gray">لا يوجد مشتركين</div>`;
    return;
  }

  const rows = arr.map(u => {
    const الاسم = esc(u.الاسم || "");
    const الجوال = esc(u.رقم_الجوال || "");
    const رمز = esc(u.رمز || "");
    const حالة = esc(u.حالة || "");
    return `
      <tr>
        <td data-label="الاسم"><b>${الاسم}</b></td>
        <td data-label="رقم الجوال">${الجوال}</td>
        <td data-label="PIN"><span class="pillSmall">${رمز}</span></td>
        <td data-label="الحالة">${حالة}</td>
      </tr>
    `;
  }).join("");

  box.innerHTML = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>رقم الجوال</th>
            <th>PIN</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="note">ملاحظة, تعديل PIN والاكشنات ستكون في المرحلة التالية</div>
  `;
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

function computeMonthsTotals(members, monthlyCollection, deliveryPerShare){
  const months = 10;
  const totals = [];

  let surplusPrev = 0;
  for(let i = 0; i < months; i++){
    const monthShares = members.reduce((s, m) => s + Number((m.اشهر && m.اشهر[i]) ? m.اشهر[i] : 0), 0);
    const deliveryAmount = monthShares * deliveryPerShare;
    const available = monthlyCollection + surplusPrev;
    const ratio = (available > 0) ? (deliveryAmount / available) : 0;
    const surplusEnd = available - deliveryAmount;

    totals.push({ monthShares, deliveryAmount, available, ratio, surplusEnd, surplusPrev });
    surplusPrev = surplusEnd;
  }
  return totals;
}

function buildMembersTable(members){
  if(!members.length){
    return `<div class="warn warn-gray">لا يوجد أعضاء في هذه الجمعية</div>`;
  }

  const headerMonths = Array.from({ length:10 }).map((_, i) => `<th>${i + 1}</th>`).join("");

  const rows = members.map(m => {
    const months = (m.اشهر || []).slice(0, 10);
    const monthTds = Array.from({ length:10 }).map((_, i) => {
      const v = Number(months[i] || 0);
      return `<td data-label="${i + 1}">${v ? `<b>${esc(fmtNum(v))}</b>` : "0"}</td>`;
    }).join("");

    return `
      <tr>
        <td data-label="الاسم"><b>${esc(m.الاسم || "")}</b></td>
        <td data-label="عدد الاسهم">${esc(fmtNum(m.عدد_الاسهم || 0))}</td>
        ${monthTds}
        <td data-label="الاجمالي"><b>${esc(fmtNum(m.اجمالي || 0))}</b></td>
      </tr>
    `;
  }).join("");

  return `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>عدد الاسهم</th>
            ${headerMonths}
            <th>الاجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildChangesTable(changes){
  if(!changes.length){
    return `<div class="warn warn-gray">لا توجد تغييرات</div>`;
  }

  const rows = changes.map(x => {
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

function buildMonthsCards(members, monthsTotals){
  const months = 10;
  const cards = [];

  for(let i = 0; i < months; i++){
    const row = monthsTotals[i];
    const status = calcMonthStatus(i, monthsTotals);

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

      members.forEach(m => {
        const v = Number((m.اشهر && m.اشهر[i]) ? m.اشهر[i] : 0);
        if(v <= 0) return;

        const total = Number(m.عدد_الاسهم || 0);
        const usedTill = sumArr((m.اشهر || []).slice(0, i + 1));
        const remaining = total - usedTill;

        acc.innerHTML += `
          <div class="accRow">
            <span><b>${esc(m.الاسم || "")}</b></span>
            <span>${esc(fmtNum(v))} سهم</span>
            <span class="pillSmall">المتبقي ${esc(fmtNum(remaining))}</span>
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

async function openSociety(id){
  showMsg("", "");
  currentSocietyId = id;

  try{
    const data = await get("لوحة جمعية للمدير", { token: adminToken, معرف_الجمعية: id });

    const soc = data.جمعية || {};
    const members = data.اعضاء || [];
    const changes = data.تغييرات || [];

    const title = `${soc.اسم || "جمعية"}  ${badgeHtml(soc.حالة)}`;
    document.getElementById("societyTitle").innerHTML = title;

    const monthlyCollection = Number(soc.عدد_الاسهم || 0) * Number(soc.قيمة_السهم_الشهري || 100);
    const deliveryPerShare = Number(soc.قيمة_تسليم_السهم || 1000);

    document.getElementById("societyMeta").innerHTML = `
      <div class="grid">
        <div class="col-6"><span class="labelPill">تاريخ البداية</span> <div class="mt8"><b>${esc(soc.تاريخ_البداية || "")}</b></div></div>
        <div class="col-6"><span class="labelPill">تاريخ النهاية</span> <div class="mt8"><b>${esc(soc.تاريخ_النهاية || "")}</b></div></div>
        <div class="col-6"><span class="labelPill">عدد المشتركين</span> <div class="mt8"><b>${esc(soc.عدد_المشتركين || 0)}</b></div></div>
        <div class="col-6"><span class="labelPill">عدد الاسهم</span> <div class="mt8"><b>${esc(fmtNum(soc.عدد_الاسهم || 0))}</b></div></div>
        <div class="col-12"><span class="labelPill">التحصيل الشهري</span> <div class="mt8"><b>${esc(Math.round(monthlyCollection))}</b></div></div>
      </div>
    `;

    const monthsTotals = computeMonthsTotals(members, monthlyCollection, deliveryPerShare);
    const monthsGrid = document.getElementById("monthsGrid");
    monthsGrid.innerHTML = "";
    const cards = buildMonthsCards(members, monthsTotals);
    cards.forEach(c => monthsGrid.appendChild(c));

    document.getElementById("societyMembersTable").innerHTML = buildMembersTable(members);
    document.getElementById("societyChangesTable").innerHTML = buildChangesTable(changes);

    hide(document.getElementById("dashboard"));
    show(document.getElementById("societyView"));

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const firstTab = document.querySelector(".tab");
    if(firstTab) firstTab.classList.add("active");
    switchTab("months", null);

  }catch(e){
    showMsg("err", e.message || String(e));
  }
}

(function(){
  bootstrap();
})();
