(function () {
  const s = جلسة();
  if (s.token && s.role === "مشترك") {
    location.href = "member.html";
    return;
  }
})();

document.getElementById("logout").addEventListener("click", function (e) {
  e.preventDefault();
  خروج();
});

function showPanel(show) {
  document.getElementById("loginBox").style.display = show ? "none" : "";
  document.getElementById("adminPanel").style.display = show ? "" : "none";
}

function setMsg(type, text) {
  if (typeof msg === "function") msg(type, text);
}

async function adminLogin() {
  setMsg("", "");
  try {
    const رمز = document.getElementById("adminPin").value.trim();
    const data = await post({ action: "دخول بالرمز", رمز });
    if (data.دور !== "مدير") throw new Error("هذا الرمز ليس للمدير");
    حفظ_جلسة(data.token, "مدير");
    showPanel(true);
    await loadAdmin();
  } catch (e) {
    setMsg("err", e.message);
  }
}

async function loadAdmin() {
  setMsg("", "");
  const s = جلسة();
  if (!s.token || s.role !== "مدير") {
    showPanel(false);
    return;
  }
  showPanel(true);

  const data = await post({ action: "معلومات مدير", token: s.token });

  renderMembers(data.مشتركين || []);
  renderSocieties(data.جمعيات || []);
}

async function createSoc() {
  setMsg("", "");
  try {
    const s = جلسة();
    if (!s.token || s.role !== "مدير") throw new Error("غير مسجل دخول كمدير");

    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value;

    if (!اسم_الجمعية) throw new Error("اسم الجمعية مطلوب");
    if (!تاريخ_البداية) throw new Error("تاريخ البداية مطلوب");

    await post({
      action: "انشاء جمعية",
      token: s.token,
      اسم_الجمعية,
      تاريخ_البداية
    });

    document.getElementById("socName").value = "";
    document.getElementById("socStart").value = "";

    setMsg("ok", "تم انشاء الجمعية");
    await loadAdmin();
  } catch (e) {
    setMsg("err", e.message);
  }
}

function renderMembers(list) {
  const box = document.getElementById("members");
  if (!list.length) {
    box.innerHTML = "<div class='hint'>لا يوجد مشتركين</div>";
    return;
  }

  const rows = list.map(m => {
    const رمز = esc(m.رمز || "");
    return `
      <tr>
        <td>${esc(m.الاسم || "")}</td>
        <td>${esc(m.رقم_الجوال || "")}</td>
        <td style="font-weight:900;color:#a11757">${رمز}</td>
        <td>${esc(m.حالة || "")}</td>
        <td><button class="btn gray" onclick="copyText('${رمز}')">نسخ</button></td>
      </tr>
    `;
  }).join("");

  box.innerHTML = `
    <div style="overflow:auto">
      <table class="tbl">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>رقم الجوال</th>
            <th>رمز</th>
            <th>الحالة</th>
            <th>نسخ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSocieties(list) {
  const cardsBox = document.getElementById("socCards");
  const sel = document.getElementById("socSelect");
  const details = document.getElementById("socDetails");

  details.innerHTML = "";

  const sorted = (list || []).slice().sort((a, b) => {
    const da = String(a.تاريخ_البداية || a.تاريخ_البداية || a.تاريخ_البداية || "");
    const db = String(b.تاريخ_البداية || b.تاريخ_البداية || b.تاريخ_البداية || "");
    return da < db ? 1 : da > db ? -1 : 0;
  });

  // بطاقات: جديدة + نشطة فقط
  const featured = sorted.filter(x => (x.حالة === "جديدة" || x.حالة === "نشطة"));

  cardsBox.innerHTML = featured.length ? featured.map(s => {
    const badge = s.حالة === "نشطة" ? "active" : "new";
    return `
      <div class="soc ${badge}" onclick="openSocietyAdmin('${esc(s.معرف)}')">
        <div class="tag">${esc(s.حالة)}</div>
        <div class="title">${esc(s.اسم)}</div>
        <div class="meta">تاريخ البداية ${esc(s.تاريخ_البداية)}</div>
        <div class="meta">تاريخ النهاية ${esc(s.تاريخ_النهاية)}</div>
        <div class="meta">عدد المشتركين ${esc(String(s.عدد_المشتركين || 0))}</div>
        <div class="meta">عدد الاسهم ${esc(String(s.عدد_الاسهم || 0))}</div>
      </div>
    `;
  }).join("") : `<div class="hint">لا توجد جمعيات جديدة او نشطة</div>`;

  // قائمة منسدلة: كل الجمعيات
  sel.innerHTML = "";
  sel.insertAdjacentHTML("beforeend", `<option value="">اختر جمعية</option>`);
  for (const s of sorted) {
    sel.insertAdjacentHTML("beforeend", `<option value="${esc(s.معرف)}">${esc(s.اسم)} , ${esc(s.حالة)}</option>`);
  }

  sel.onchange = function () {
    const id = sel.value;
    if (!id) {
      details.innerHTML = "";
      return;
    }
    openSocietyAdmin(id);
  };
}

async function openSocietyAdmin(socId) {
  setMsg("", "");
  try {
    const s = جلسة();
    if (!s.token || s.role !== "مدير") throw new Error("غير مسجل دخول كمدير");

    const data = await post({
      action: "لوحة جمعية للمدير",
      token: s.token,
      معرف_الجمعية: socId
    });

    renderSocietyAdmin(data);
  } catch (e) {
    setMsg("err", e.message);
  }
}

function renderSocietyAdmin(data) {
  const box = document.getElementById("socDetails");
  const society = data.جمعية || null;
  const members = data.اعضاء || [];
  const changes = data.تغييرات || [];

  if (!society) {
    box.innerHTML = `<div class="hint">لا توجد بيانات</div>`;
    return;
  }

  const monthHeaders = [];
  for (let i = 1; i <= 10; i++) monthHeaders.push(`<th>${i}</th>`);

  const memberRows = members.map(r => {
    const months = (r.اشهر || []);
    const monthTds = [];
    for (let i = 0; i < 10; i++) monthTds.push(`<td>${esc(String(months[i] || 0))}</td>`);
    return `
      <tr>
        <td>${esc(r.الاسم || "")}</td>
        <td>${esc(String(r.عدد_الاسهم || 0))}</td>
        ${monthTds.join("")}
        <td style="font-weight:900">${esc(String(r.اجمالي || 0))}</td>
      </tr>
    `;
  }).join("");

  const changeRows = changes.length ? changes.map(x => {
    return `
      <tr>
        <td>${esc(x.الاسم || "")}</td>
        <td>${esc(x.الحالة || "")}</td>
        <td>${esc(x.تاريخ_اول_اشتراك || "")}</td>
        <td>${esc(x.تاريخ_اخر_تعديل || "")}</td>
        <td>${esc(String(x.اسهم_قبل || ""))}</td>
        <td>${esc(String(x.اسهم_بعد || ""))}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="6">لا توجد تغييرات</td></tr>`;

  box.innerHTML = `
    <div class="card" style="margin-top:12px">
      <h3>تفاصيل الجمعية</h3>
      <div class="meta">اسم الجمعية ${esc(society.اسم)}</div>
      <div class="meta">الحالة ${esc(society.حالة)}</div>
      <div class="meta">تاريخ البداية ${esc(society.تاريخ_البداية)}</div>
      <div class="meta">تاريخ النهاية ${esc(society.تاريخ_النهاية)}</div>
      <div class="meta">عدد المشتركين ${esc(String(society.عدد_المشتركين || 0))}</div>
      <div class="meta">عدد الاسهم ${esc(String(society.عدد_الاسهم || 0))}</div>
    </div>

    <div class="card" style="margin-top:12px">
      <h3>اعضاء الجمعية وتوزيع الاسهم على الاشهر</h3>
      <div class="hint">يعرض توزيع الاشهر 1 الى 10 حسب جدول الرغبات</div>
      <div style="overflow:auto">
        <table class="tbl">
          <thead>
            <tr>
              <th>المشترك</th>
              <th>اسهمه</th>
              ${monthHeaders.join("")}
              <th>الاجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${memberRows || `<tr><td colspan="13">لا يوجد اعضاء</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <h3>المنسحبون وتعديلات الاسهم</h3>
      <div class="hint">يعرض تاريخ اول اشتراك واخر تعديل, او انسحاب</div>
      <div style="overflow:auto">
        <table class="tbl">
          <thead>
            <tr>
              <th>المشترك</th>
              <th>النوع</th>
              <th>اول اشتراك</th>
              <th>اخر تعديل</th>
              <th>اسهم قبل</th>
              <th>اسهم بعد</th>
            </tr>
          </thead>
          <tbody>${changeRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function copyText(t) {
  try {
    navigator.clipboard.writeText(String(t || ""));
    setMsg("ok", "تم النسخ");
  } catch (e) {
    setMsg("err", "تعذر النسخ");
  }
}

// تشغيل تلقائي اذا الجلسة موجودة
(async function boot() {
  try {
    const s = جلسة();
    if (s.token && s.role === "مدير") {
      showPanel(true);
      await loadAdmin();
    } else {
      showPanel(false);
    }
  } catch (e) {
    showPanel(false);
  }
})();
