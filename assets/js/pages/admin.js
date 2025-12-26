let ADMIN = {
  token: "",
  societyId: "",
  societyData: null
};

function fmtDate(d){
  return String(d || "").trim();
}

function setShow(id, yes){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = yes ? "" : "none";
}

function pill(text){
  return `<span class="pill">${esc(text || "")}</span>`;
}

function badgeState(state){
  if(state === "نشطة") return `<span class="badge green">نشطة</span>`;
  if(state === "مغلقة") return `<span class="badge gray">مغلقة</span>`;
  return `<span class="badge pink">جديدة</span>`;
}

function money(x){
  const n = Number(x || 0);
  if(!isFinite(n)) return "0";
  return String(Math.round(n * 100) / 100);
}

/* ====== بدء الصفحة ====== */
(function init(){
  const s = جلسة();

  // إظهار زر الخروج لو في جلسة
  if(s && s.token){
    document.getElementById("navLogout").style.display = "";
  }

  // لو المستخدم مدير, ادخل مباشرة
  if(s && s.token && s.role === "مدير"){
    ADMIN.token = s.token;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "";
    loadAdminDashboard();
    return;
  }

  // لو مشترك, امنع دخول المدير
  if(s && s.token && s.role === "مشترك"){
    msg("err", "لا يمكن الدخول لشاشة المدير بحساب مشترك");
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "none";
    return;
  }

  // زائر, يظهر صندوق الدخول
  document.getElementById("loginBox").style.display = "";
  document.getElementById("adminPanel").style.display = "none";
})();

/* ====== دخول المدير ====== */
async function adminLogin(){
  msg("", "");
  try{
    const pin = document.getElementById("adminPin").value.trim();
    if(!pin){
      msg("err","رمز PIN مطلوب");
      return;
    }

    const data = await post({ action:"دخول بالرمز", رمز: pin });

    if(String(data.دور) !== "مدير"){
      msg("err","هذا الرمز ليس للمدير");
      return;
    }

    حفظ_جلسة(data.token, "مدير");
    ADMIN.token = data.token;

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "";
    msg("ok","تم الدخول بنجاح");

    await loadAdminDashboard();

  }catch(e){
    msg("err", e.message || String(e));
  }
}

/* ====== إنشاء جمعية ====== */
async function createSoc(){
  msg("", "");
  try{
    if(!ADMIN.token){
      msg("err","غير مسجل دخول كمدير");
      return;
    }

    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value.trim(); // yyyy-mm-dd من input date

    if(!اسم_الجمعية){
      msg("err","اسم الجمعية مطلوب");
      return;
    }
    if(!تاريخ_البداية){
      msg("err","تاريخ البداية مطلوب");
      return;
    }

    await get("انشاء جمعية", {
      token: ADMIN.token,
      اسم_الجمعية,
      تاريخ_البداية
    });

    msg("ok","تم انشاء الجمعية");
    document.getElementById("socName").value = "";
    document.getElementById("socStart").value = "";

    await loadAdminDashboard();

  }catch(e){
    msg("err", e.message || String(e));
  }
}

/* ====== تحميل لوحة المدير ====== */
async function loadAdminDashboard(){
  try{
    const data = await get("معلومات مدير", { token: ADMIN.token });
    const societies = data.جمعيات || [];
    const members = data.مشتركين || [];

    renderSocieties(societies);
    renderMembers(members);

  }catch(e){
    msg("err", e.message || String(e));
  }
}

/* ====== عرض الجمعيات كبطاقات ====== */
function renderSocieties(arr){
  const box = document.getElementById("societiesAdmin");
  const count = document.getElementById("socCount");

  if(count) count.textContent = "عدد الجمعيات " + (arr.length || 0);

  if(!arr.length){
    box.innerHTML = `<div class="col-12"><div class="warn warn-gray">لا توجد جمعيات</div></div>`;
    return;
  }

  // عرض كل الجمعيات كبطاقات, داخل لوحة المدير
  box.innerHTML = arr.map(s=>{
    const st = String(s.حالة || "جديدة");
    const cls = st === "نشطة" ? "socCard socActive" : (st === "مغلقة" ? "socCard socClosed" : "socCard socNew");

    return `
      <div class="col-4">
        <div class="${cls}" onclick="openSocietyDetails('${esc(String(s.معرف))}')">
          <div class="socHead">
            <div class="socTitle">${esc(s.اسم || "")}</div>
            <div>${badgeState(st)}</div>
          </div>

          <div class="socMeta">
            <div>${pill("البداية " + fmtDate(s.تاريخ_البداية))}</div>
            <div>${pill("النهاية " + fmtDate(s.تاريخ_النهاية))}</div>
          </div>

          <div class="socStats">
            <div>${pill("المشتركين " + (s.عدد_المشتركين || 0))}</div>
            <div>${pill("الأسهم " + (s.عدد_الاسهم || 0))}</div>
            <div>${pill("الإجمالي " + money(s.اجمالي_القيمة || 0))}</div>
          </div>

          ${st === "جديدة" ? `<div class="socHint">اضغط لفتح التفاصيل</div>` : `<div class="socHint">اضغط لعرض التفاصيل</div>`}
        </div>
      </div>
    `;
  }).join("");
}

/* ====== فتح تفاصيل جمعية ====== */
async function openSocietyDetails(sid){
  msg("", "");
  try{
    ADMIN.societyId = String(sid || "").trim();
    if(!ADMIN.societyId){
      msg("err","معرف الجمعية غير صحيح");
      return;
    }

    // جلب تفاصيل لوحة جمعية للمدير من سكربت قوقل
    const data = await get("لوحة جمعية للمدير", {
      token: ADMIN.token,
      معرف_الجمعية: ADMIN.societyId
    });

    ADMIN.societyData = data;

    const s = data.جمعية || {};
    document.getElementById("socTitle").textContent = "تفاصيل " + (s.اسم || "");
    document.getElementById("socMeta").innerHTML =
      `الحالة ${pill(s.حالة || "")} ` +
      `${pill("البداية " + fmtDate(s.تاريخ_البداية))} ` +
      `${pill("النهاية " + fmtDate(s.تاريخ_النهاية))}`;

    // إظهار كرت التفاصيل
    document.getElementById("societyDetailsCard").style.display = "";

    // افتراضي على تبويب الأشهر
    switchSocTab("months");

    // بناء بطاقات الشهور
    buildMonthCards(data);

    // بناء جدول الأعضاء
    buildMembersTable(data);

    // بناء جدول التغييرات
    buildChangesTable(data);

    // اغلاق لوحة الشهر المفتوحة
    closeMonthPanel();

    // تمرير للمكان
    document.getElementById("societyDetailsCard").scrollIntoView({ behavior:"smooth", block:"start" });

  }catch(e){
    msg("err", e.message || String(e));
  }
}

function closeSocietyDetails(){
  ADMIN.societyId = "";
  ADMIN.societyData = null;
  document.getElementById("societyDetailsCard").style.display = "none";
  closeMonthPanel();
}

function switchSocTab(name){
  const tabs = ["months","members","changes","collection","delivery"];
  for(const t of tabs){
    const panel = document.getElementById("socTab" + t.charAt(0).toUpperCase() + t.slice(1));
    if(panel) panel.style.display = (t === name) ? "" : "none";

    const btn = document.getElementById("tabBtn" + t.charAt(0).toUpperCase() + t.slice(1));
    if(btn){
      if(t === name) btn.classList.add("active");
      else btn.classList.remove("active");
    }
  }
}

/* ====== بطاقات الشهور ====== */
function statusClassFromRatio(ratio){
  // ratio = مبلغ_التسليم / الموجود
  if(!(ratio >= 0)) return "month-normal";
  if(ratio > 1) return "month-over";
  if(ratio === 1) return "month-limit";
  if(ratio >= 0.75) return "month-near";
  return "month-normal";
}

function buildMonthCards(data){
  const grid = document.getElementById("monthsGridAdmin");
  grid.innerHTML = "";

  const keys = data.اشهر_مفاتيح || []; // yyyy-mm
  const members = data.اعضاء || [];

  // حاليا لا يوجد في API ملخص شهر (موجود/تسليم/فائض), فنعرض “طبيعي”
  // لاحقا عند إضافة ملخصات سنلونها بدقة
  for(let i=0;i<10;i++){
    const idx = i;
    const totalShares = members.reduce((sum,m)=> sum + Number((m.اشهر && m.اشهر[idx]) || 0), 0);
    const deliveryAmount = totalShares * 1000;

    const card = document.createElement("div");
    card.className = "monthCard month-normal";
    card.innerHTML = `
      <div class="monthHead">
        <div class="monthTitle">شهر ${idx+1}</div>
        <div class="monthKey">${esc(keys[idx] || "")}</div>
      </div>
      <div class="monthStats">
        <div>${pill("أسهم الشهر " + totalShares)}</div>
        <div>${pill("قيمة التسليم " + deliveryAmount)}</div>
      </div>
      <div class="monthHint">اضغط لعرض التفاصيل</div>
    `;

    card.onclick = function(){
      openMonth(idx);
    };

    grid.appendChild(card);
  }
}

function openMonth(index){
  const d = ADMIN.societyData;
  if(!d) return;

  const members = d.اعضاء || [];
  const keys = d.اشهر_مفاتيح || [];
  const monthNo = index + 1;

  document.getElementById("monthTitle").textContent = "تفاصيل شهر " + monthNo;
  document.getElementById("monthMeta").textContent = "المفتاح " + (keys[index] || "");

  // عرض قائمة المستلمين لهذا الشهر (من توزيع الأسهم)
  const rows = [];
  for(const m of members){
    const v = Number((m.اشهر && m.اشهر[index]) || 0);
    if(v > 0){
      const remain = Number(m.عدد_الاسهم || 0) - Number(m.اجمالي || 0); // متبقي غير دقيق هنا لأنه يعتمد على كل الأشهر, لكنه يبين إن كان التوزيع كامل
      rows.push({
        الاسم: m.الاسم || "",
        اسهم_هذا_الشهر: v,
        قيمة: v * 1000,
        اجمالي_اختيار: Number(m.اجمالي || 0),
        عدد_اسهمه: Number(m.عدد_الاسهم || 0),
        متبقي_تقريبي: remain
      });
    }
  }

  if(!rows.length){
    document.getElementById("monthBody").innerHTML = `<div class="warn warn-gray">لا يوجد تسليم في هذا الشهر</div>`;
  }else{
    const totalShares = rows.reduce((s,x)=> s + Number(x.اسهم_هذا_الشهر||0), 0);
    const totalAmount = totalShares * 1000;

    document.getElementById("monthBody").innerHTML = `
      <div class="warn warn-gray">
        إجمالي أسهم التسليم لهذا الشهر ${esc(totalShares)} , إجمالي مبلغ التسليم ${esc(totalAmount)}
      </div>

      <div class="tableWrap mt12">
        <table class="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>أسهم هذا الشهر</th>
              <th>قيمة التسليم</th>
              <th>عدد أسهمه</th>
              <th>إجمالي اختياراته</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`
              <tr>
                <td data-label="الاسم"><b>${esc(r.الاسم)}</b></td>
                <td data-label="أسهم هذا الشهر">${esc(r.اسهم_هذا_الشهر)}</td>
                <td data-label="قيمة التسليم">${esc(r.قيمة)}</td>
                <td data-label="عدد أسهمه">${esc(r.عدد_اسهمه)}</td>
                <td data-label="إجمالي اختياراته">${esc(r.اجمالي_اختيار)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  document.getElementById("monthPanel").style.display = "";
  document.getElementById("monthPanel").scrollIntoView({ behavior:"smooth", block:"start" });
}

function closeMonthPanel(){
  document.getElementById("monthPanel").style.display = "none";
  document.getElementById("monthBody").innerHTML = "";
}

/* ====== جدول الأعضاء ====== */
function buildMembersTable(data){
  const box = document.getElementById("socMembersTable");
  const members = data.اعضاء || [];

  if(!members.length){
    box.innerHTML = `<div class="warn warn-gray">لا يوجد أعضاء في هذه الجمعية</div>`;
    return;
  }

  const thMonths = [];
  for(let i=1;i<=10;i++){
    thMonths.push(`<th>شهر ${i}</th>`);
  }

  box.innerHTML = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>عدد الأسهم</th>
            ${thMonths.join("")}
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(m=>{
            const months = (m.اشهر || []);
            let tds = "";
            for(let i=0;i<10;i++){
              const v = Number(months[i] || 0);
              tds += `<td data-label="شهر ${i+1}">${v ? "<b>"+esc(v)+"</b>" : "0"}</td>`;
            }
            return `
              <tr>
                <td data-label="الاسم"><b>${esc(m.الاسم || "")}</b></td>
                <td data-label="عدد الأسهم">${esc(m.عدد_الاسهم || 0)}</td>
                ${tds}
                <td data-label="الإجمالي"><b>${esc(m.اجمالي || 0)}</b></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ====== جدول التغييرات ====== */
function buildChangesTable(data){
  const box = document.getElementById("socChangesTable");
  const arr = data.تغييرات || [];

  if(!arr.length){
    box.innerHTML = `<div class="warn warn-gray">لا توجد تغييرات مسجلة (انسحاب أو تعديل أسهم)</div>`;
    return;
  }

  box.innerHTML = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الحالة</th>
            <th>تاريخ أول اشتراك</th>
            <th>تاريخ آخر تعديل</th>
            <th>أسهم بعد التعديل</th>
          </tr>
        </thead>
        <tbody>
          ${arr.map(x=>`
            <tr>
              <td data-label="الاسم"><b>${esc(x.الاسم || "")}</b></td>
              <td data-label="الحالة">${esc(x.الحالة || "")}</td>
              <td data-label="تاريخ أول اشتراك">${esc(x.تاريخ_اول_اشتراك || "")}</td>
              <td data-label="تاريخ آخر تعديل">${esc(x.تاريخ_اخر_تعديل || "")}</td>
              <td data-label="أسهم بعد التعديل"><b>${esc(x.اسهم_بعد || "")}</b></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ====== جدول المشتركين في لوحة المدير (PIN + نسخ) ====== */
function renderMembers(arr){
  const box = document.getElementById("members");

  if(!arr.length){
    box.innerHTML = `<div class="warn warn-gray">لا يوجد مشتركين</div>`;
    return;
  }

  box.innerHTML = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الجوال</th>
            <th>PIN</th>
            <th>نسخ</th>
            <th>تفاصيل</th>
          </tr>
        </thead>
        <tbody>
          ${arr.map(u=>`
            <tr>
              <td data-label="الاسم"><b>${esc(u.الاسم || "")}</b></td>
              <td data-label="الجوال">${esc(u.رقم_الجوال || "")}</td>
              <td data-label="PIN"><b>${esc(u.رمز || "")}</b></td>
              <td data-label="نسخ">
                <button class="btn btn2" onclick="copyText('${esc(String(u.رمز||""))}')">نسخ</button>
              </td>
              <td data-label="تفاصيل">
                <button class="btn btn2" onclick="memberDetailsSoon('${esc(String(u.معرف||""))}')">تفاصيل</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="note">
      زر تفاصيل المشترك جاهز, سنفعله لاحقا لتعديل الرغبات (تقديم فقط إذا الشهر يسمح) حسب اتفاقنا
    </div>
  `;
}

function memberDetailsSoon(uid){
  msg("err","تفاصيل المشترك سيتم تفعيلها في مرحلة الأكشنات");
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(String(text || ""));
    msg("ok","تم النسخ");
    setTimeout(()=> msg("", ""), 600);
  }catch(e){
    msg("err","تعذر النسخ, انسخ يدويا");
  }
}
