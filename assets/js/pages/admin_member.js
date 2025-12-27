// assets/js/pages/admin_member.js , ملف جديد
let adminToken = "";
let memberId = "";
let memberData = null;

let prefsCtx = {
  sid: "",
  months: [],
  shares: 0,
  existing: null
};

function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function toNum(x){
  const n = Number(String(x || "").trim() || 0);
  return isFinite(n) ? n : 0;
}

function roundHalf(x){
  const n = toNum(x);
  return Math.round(n * 2) / 2;
}

function normalizeMonthKey(s){
  const v = String(s || "").trim();
  if(!v) return "";

  const m1 = v.match(/^(\d{4})-(\d{2})$/);
  if(m1) return m1[1] + "-" + m1[2];

  const m3 = v.match(/^(\d{4})-(\d{1})$/);
  if(m3) return m3[1] + "-0" + m3[2];

  return v;
}

function monthLabelGregorian(yyyyMM){
  const key = normalizeMonthKey(yyyyMM);
  const parts = key.split("-");
  if(parts.length !== 2) return key;

  const y = parts[0];
  const m = Number(parts[1]);

  const شهور = [
    "يناير","فبراير","مارس","ابريل","مايو","يونيو",
    "يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"
  ];

  if(m >= 1 && m <= 12) return شهور[m-1] + " " + y;
  return key;
}

function monthLabelHijriFromYYYYMM(yyyyMM){
  const key = normalizeMonthKey(yyyyMM);
  const parts = key.split("-");
  if(parts.length !== 2) return "";

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if(!(y > 0 && m >= 1 && m <= 12)) return "";

  const d = new Date(y, m - 1, 1);
  try{
    const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      month: "long",
      year: "numeric"
    });
    return fmt.format(d);
  }catch(e){
    return "";
  }
}

function setHtml(id,h){ const e=document.getElementById(id); if(e) e.innerHTML=h; }
function setText(id,t){ const e=document.getElementById(id); if(e) e.textContent=t; }

function copyText(id){
  const e = document.getElementById(id);
  if(!e) return;
  const t = (e.textContent || "").trim();
  if(!t) return;

  navigator.clipboard.writeText(t).then(()=>{
    msg("ok","تم النسخ");
  }).catch(()=>{
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand("copy"); }catch(_e){}
    ta.remove();
    msg("ok","تم النسخ");
  });
}

function renderMemberInfo(u){
  return `
    <div class="kv"><div class="k">الاسم</div><div class="v"><b>${esc(u.الاسم||"")}</b></div></div>
    <div class="kv"><div class="k">رقم الجوال</div><div class="v"><b dir="ltr">${esc(u.رقم_الجوال||"")}</b></div></div>
    <div class="kv"><div class="k">الحالة</div><div class="v"><b>${esc(u.حالة||"")}</b></div></div>
  `;
}

function renderSubs(subs){
  if(!subs.length){
    return `<div class="warn warn-gray">لا توجد اشتراكات لهذا المشترك</div>`;
  }

  return `
    <div class="grid">
      ${subs.map(s=>{
        const canEdit = String(s.حالة)==="جديدة";
        return `
          <div class="col-4">
            <div class="soc">
              <div class="socTop">
                <div style="font-weight:900">${esc(s.اسم_الجمعية||"")}</div>
                ${badge(s.حالة||"")}
              </div>

              <div class="socBody">
                <div>بداية ${esc(s.تاريخ_البداية||"")}</div>
                <div>نهاية ${esc(s.تاريخ_النهاية||"")}</div>
                <div>عدد الأسهم الحالية <b>${esc(s.عدد_الاسهم||0)}</b></div>
              </div>

              <div class="mt12">
                <div class="grid">
                  <div class="col-8">
                    <input class="input" id="shares_${esc(s.معرف_الجمعية)}" value="${esc(s.عدد_الاسهم||0)}" ${canEdit ? "" : "disabled"}>
                  </div>
                  <div class="col-4">
                    <button class="btn btn2 w100" ${canEdit ? "" : "disabled"} onclick="saveShares('${esc(s.معرف_الجمعية)}')">حفظ</button>
                  </div>
                  <div class="col-12">
                    <button class="btn w100" ${canEdit ? "" : "disabled"} onclick="openPrefs('${esc(s.معرف_الجمعية)}')">تعديل الرغبات</button>
                    ${!canEdit ? `<div class="note">الرغبات والأسهم تعديلها فقط في جمعية جديدة</div>` : ``}
                  </div>
                </div>
              </div>

            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function buildPrefsTable(months){
  let html = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الشهر</th>
            <th>الشهر الهجري</th>
            <th>عدد الاسهم</th>
            <th>النوع</th>
          </tr>
        </thead>
        <tbody>
  `;

  for(let i=0;i<months.length;i++){
    const key = normalizeMonthKey(months[i] || "");
    const ميلادي = monthLabelGregorian(key);
    const هجري = monthLabelHijriFromYYYYMM(key);

    html += `
      <tr>
        <td data-label="الشهر">
          <div class="cellTitle">${esc(ميلادي)}</div>
          <div class="cellSub">${esc(key)}</div>
        </td>
        <td data-label="الشهر الهجري">${esc(هجري || "-")}</td>
        <td data-label="عدد الاسهم">
          <input class="input" inputmode="decimal" id="pm${i+1}" value="0" placeholder="0 او 0.5 او 1">
        </td>
        <td data-label="النوع">
          <select class="input" id="pt${i+1}">
            <option value="قابل للتعديل">قابل للتعديل</option>
            <option value="ضروري">ضروري</option>
          </select>
        </td>
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function fillExisting(existing, monthCount){
  if(!existing) return;
  for(let i=1;i<=monthCount;i++){
    const v = existing["شهر " + i];
    const t = existing["نوع " + i];
    if(document.getElementById("pm"+i)) document.getElementById("pm"+i).value = String(v||0);
    if(document.getElementById("pt"+i)) document.getElementById("pt"+i).value = (String(t)==="ضروري") ? "ضروري" : "قابل للتعديل";
  }
}

function calcSum(monthCount){
  let sum = 0;
  for(let i=1;i<=monthCount;i++){
    sum += roundHalf(document.getElementById("pm"+i).value);
  }
  return Math.round(sum * 2) / 2;
}

function renderSumMessage(sum, shares){
  if(sum < shares){
    return `<div class="warn warn-orange">مجموع الاسهم المدخلة اقل من اسهم المشترك , مجموع الحالي ${esc(sum)} من ${esc(shares)}</div>`;
  }
  if(sum > shares){
    return `<div class="warn warn-red">مجموع الاسهم المدخلة اكثر من اسهم المشترك , مجموع الحالي ${esc(sum)} من ${esc(shares)}</div>`;
  }
  return `<div class="warn warn-green">مجموع الاسهم يساوي عدد اسهم المشترك , مجموع الحالي ${esc(sum)} من ${esc(shares)}</div>`;
}

async function load(){
  const s = جلسة();
  adminToken = (s && s.token) ? s.token : "";
  if(!adminToken || s.role !== "مدير"){
    location.href = "admin.html";
    return;
  }

  const navLogout = document.getElementById("navLogout");
  if(navLogout){
    navLogout.style.display = "";
    navLogout.onclick = function(e){
      e.preventDefault();
      خروج();
    };
  }

  memberId = q("معرف");
  if(!memberId){
    msg("err","معرف المشترك غير موجود");
    return;
  }

  msg("", "");

  try{
    const data = await get("تفاصيل مشترك للمدير", { token: adminToken, معرف_المستخدم: memberId });
    memberData = data;

    setHtml("memberInfo", renderMemberInfo(data.مستخدم || {}));
    setText("pinCurrent", String((data.مستخدم && data.مستخدم.رمز) ? data.مستخدم.رمز : "-"));

    setHtml("subsBox", renderSubs(data.اشتراكات || []));

  }catch(e){
    msg("err", e.message || String(e));
  }
}

async function savePin(){
  const v = (document.getElementById("pinNew").value || "").trim();
  if(!v){
    msg("err","PIN جديد مطلوب");
    return;
  }

  msg("", "");
  const btn = document.getElementById("btnSavePin");
  if(btn){ btn.disabled = true; btn.style.opacity = "0.7"; btn.style.pointerEvents = "none"; }

  try{
    const out = await get("تحديث رمز مشترك", { token: adminToken, معرف_المستخدم: memberId, رمز: v });
    setText("pinCurrent", String(out.رمز || v));
    document.getElementById("pinNew").value = "";
    msg("ok","تم تحديث الرمز");
  }catch(e){
    msg("err", e.message || String(e));
  }finally{
    if(btn){ btn.disabled = false; btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
  }
}

async function saveShares(sid){
  const el = document.getElementById("shares_"+sid);
  if(!el) return;
  const shares = (el.value || "").trim();
  msg("", "");

  try{
    await get("تعديل اشتراك جمعية للمدير", { token: adminToken, معرف_المستخدم: memberId, معرف_الجمعية: sid, عدد_الاسهم: shares });
    msg("ok","تم تعديل عدد الأسهم");

    const data = await get("تفاصيل مشترك للمدير", { token: adminToken, معرف_المستخدم: memberId });
    memberData = data;
    setHtml("subsBox", renderSubs(data.اشتراكات || []));

  }catch(e){
    msg("err", e.message || String(e));
  }
}

async function openPrefs(sid){
  msg("", "");
  document.getElementById("prefsMsg").innerHTML = "";

  try{
    const data = await get("رغبات حالة للمدير", { token: adminToken, معرف_المستخدم: memberId, معرف_الجمعية: sid });

    const soc = data.جمعية || {};
    const months = (data.الاشهر || []).map(normalizeMonthKey);
    const shares = toNum(data.عدد_اسهم_المشترك);

    prefsCtx.sid = sid;
    prefsCtx.months = months;
    prefsCtx.shares = shares;
    prefsCtx.existing = data.رغبات || null;

    document.getElementById("prefsTitle").textContent = "رغبات المشترك , " + (soc.اسم || "");
    setHtml("prefsMeta",
      "اسم الجمعية <b>" + esc(soc.اسم || "") + "</b><br>" +
      "تاريخ البداية <b>" + esc(soc.تاريخ_البداية || "") + "</b><br>" +
      "تاريخ النهاية <b>" + esc(soc.تاريخ_النهاية || "") + "</b><br>" +
      "عدد اسهم المشترك <b>" + esc(shares) + "</b>"
    );

    if(String(soc.حالة) !== "جديدة"){
      setHtml("prefsTable", "<div class='warn warn-gray'>الرغبات متاحة فقط في جمعية جديدة</div>");
      document.getElementById("btnSavePrefs").style.display = "none";
    }else{
      document.getElementById("btnSavePrefs").style.display = "";
      setHtml("prefsTable", buildPrefsTable(months));
      fillExisting(prefsCtx.existing, months.length);

      function refresh(){
        const sum = calcSum(months.length);
        document.getElementById("prefsMsg").innerHTML = renderSumMessage(sum, shares);
      }

      for(let i=1;i<=months.length;i++){
        document.getElementById("pm"+i).addEventListener("input", refresh);
        document.getElementById("pt"+i).addEventListener("change", refresh);
      }
      refresh();
    }

    document.getElementById("prefsCard").style.display = "";

    window.scrollTo({ top: document.getElementById("prefsCard").offsetTop - 10, behavior: "smooth" });

  }catch(e){
    msg("err", e.message || String(e));
  }
}

function closePrefs(){
  document.getElementById("prefsCard").style.display = "none";
  prefsCtx = { sid:"", months:[], shares:0, existing:null };
}

async function savePrefs(){
  if(!prefsCtx.sid){
    msg("err","لا يوجد جمعية للرغبات");
    return;
  }

  const monthsCount = prefsCtx.months.length;
  const sum = calcSum(monthsCount);

  if(sum !== prefsCtx.shares){
    msg("err","لا يمكن الحفظ, مجموع الاسهم لا يطابق عدد اسهم المشترك");
    return;
  }

  const payload = { token: adminToken, معرف_المستخدم: memberId, معرف_الجمعية: prefsCtx.sid };
  for(let i=1;i<=monthsCount;i++){
    payload["شهر"+i] = roundHalf(document.getElementById("pm"+i).value);
    payload["نوع"+i] = document.getElementById("pt"+i).value;
  }

  msg("", "");
  const btn = document.getElementById("btnSavePrefs");
  if(btn){ btn.disabled = true; btn.style.opacity = "0.7"; btn.style.pointerEvents = "none"; }

  try{
    await get("حفظ الرغبات للمدير", payload);
    msg("ok","تم حفظ الرغبات");

    closePrefs();

  }catch(e){
    msg("err", e.message || String(e));
  }finally{
    if(btn){ btn.disabled = false; btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
  }
}

(function(){
  load();
})();
