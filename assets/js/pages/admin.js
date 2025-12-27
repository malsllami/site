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

function switchTab(tab, ev){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  if(ev && ev.target) ev.target.classList.add("active");

  const months = document.getElementById("tab-months");
  const collection = document.getElementById("tab-collection");
  const delivery = document.getElementById("tab-delivery");
  const members = document.getElementById("tab-members");
  const changes = document.getElementById("tab-changes");

  if(months) months.style.display = (tab==="months") ? "" : "none";
  if(collection) collection.style.display = (tab==="collection") ? "" : "none";
  if(delivery) delivery.style.display = (tab==="delivery") ? "" : "none";
  if(members) members.style.display = (tab==="members") ? "" : "none";
  if(changes) changes.style.display = (tab==="changes") ? "" : "none";
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

    حفظ_جلسة(data.token, "مدير", data.الاسم || "");
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
          <div class="socTop" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div style="font-weight:900">${title}</div>
            ${badgeHtml(s.حالة)}
          </div>
          <div class="socBody" style="margin-top:10px;color:#6c7a86;font-weight:800;line-height:1.9">
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

function buildMembersCards(members){
  if(!members.length){
    return `<div class="warn warn-gray">لا يوجد مشتركين في هذه الجمعية</div>`;
  }

  const cards = members.map(m=>{
    const nm = esc(m.الاسم || "");
    const shares = esc(fmtNum(m.عدد_الاسهم || 0));
    const lastDelivery = (() => {
      const arr = (m.اشهر || []).slice(0,10);
      let last = 0;
      for(let i=0;i<arr.length;i++){
        if(Number(arr[i]||0) > 0) last = i+1;
      }
      return last ? ("شهر " + last) : "-";
    })();

    return `
      <div class="mCard">
        <div class="mTop">
          <div class="mName">${nm}</div>
          <div class="badge gray">مشترك</div>
        </div>
        <div class="mMeta">
          <div class="mRow"><span>عدد الأسهم</span><b>${shares}</b></div>
          <div class="mRow"><span>آخر شهر استلام</span><b>${esc(lastDelivery)}</b></div>
        </div>
        <div class="mActions">
          <button class="btn btn2" onclick="alert('واجهة فتح المشترك سيتم ربطها بالصفحة الجديدة لاحقا')">فتح</button>
        </div>
      </div>
    `;
  }).join("");

  return `<div class="memberCards">${cards}</div>`;
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

    const mCardsBox = document.getElementById("societyMembersCards");
    if(mCardsBox) mCardsBox.innerHTML = buildMembersCards(members);

    document.getElementById("societyChangesTable").innerHTML = buildChangesTable(changes);

    const colBox = document.getElementById("collectionBox");
    const delBox = document.getElementById("deliveryBox");
    if(colBox) colBox.innerHTML = `<div class="warn warn-gray">جاهز للمرحلة القادمة, سيتم بناء بطاقات التحصيل هنا</div>`;
    if(delBox) delBox.innerHTML = `<div class="warn warn-gray">جاهز للمرحلة القادمة, سيتم بناء بطاقات التسليم هنا</div>`;

    hide(document.getElementById("dashboard"));
    show(document.getElementById("societyView"));

    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
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
