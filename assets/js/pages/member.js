let userToken = "";
let currentSocietyId = "";
let currentSociety = null;
let currentPrefs = null;
let currentShares = 0;
let monthsKeys = [];

function show(el){ el.style.display = ""; }
function hide(el){ el.style.display = "none"; }

function showMsg(type, text){ msg(type, text); }

async function bootstrap(){
  const s = جلسة();
  if(!s || !s.token){
    location.href = "index.html";
    return;
  }
  userToken = s.token;

  await loadMemberInfo();
  await loadSocieties();
}

async function loadMemberInfo(){
  const data = await get("معلومات مشترك", { token: userToken });
  const u = data.مستخدم;
  document.getElementById("memberInfo").innerHTML = `
    <div><b>الاسم:</b> ${esc(u.الاسم)}</div>
    <div><b>رقم الجوال:</b> ${esc(u.رقم_الجوال)}</div>
  `;
}

async function loadSocieties(){
  const data = await get("جمعيات المشترك", { token: userToken });
  const box = document.getElementById("societiesList");

  if(!data.اشتراكات.length){
    box.innerHTML = `<div class="warn warn-gray">لا توجد جمعيات</div>`;
    return;
  }

  box.innerHTML = data.اشتراكات.map(s=>`
    <div class="soc">
      <div><b>${esc(s.اسم_الجمعية)}</b></div>
      <div>الحالة ${esc(s.حالة)}</div>
      <div>عدد الأسهم ${esc(s.عدد_الاسهم)}</div>
      <button class="btn mt8" onclick="openSociety('${esc(s.معرف_الجمعية)}')">فتح</button>
    </div>
  `).join("");
}

async function openSociety(id){
  currentSocietyId = id;

  const data = await get("رغبات حالة", {
    token: userToken,
    معرف_الجمعية: id
  });

  currentSociety = data.جمعية;
  currentPrefs = data.رغبات;
  currentShares = Number(data.عدد_اسهم_المشترك || 0);
  monthsKeys = data.الاشهر || [];

  hide(document.getElementById("societiesList"));
  show(document.getElementById("societyPage"));

  document.getElementById("socTitle").innerText = currentSociety.اسم;
  document.getElementById("socMeta").innerHTML = `
    <div>تاريخ البداية ${esc(currentSociety.تاريخ_البداية)}</div>
    <div>تاريخ النهاية ${esc(currentSociety.تاريخ_النهاية)}</div>
  `;

  document.getElementById("sharesInput").value = currentShares || "";

  if(!currentPrefs){
    showStepShares();
  }else{
    showSummary();
  }
}

function showStepShares(){
  show(document.getElementById("stepShares"));
  hide(document.getElementById("stepPrefs"));
  hide(document.getElementById("prefsSummary"));
}

function showStepPrefs(){
  hide(document.getElementById("stepShares"));
  show(document.getElementById("stepPrefs"));
  hide(document.getElementById("prefsSummary"));

  buildPrefsForm();
}

function showSummary(){
  hide(document.getElementById("stepShares"));
  hide(document.getElementById("stepPrefs"));
  show(document.getElementById("prefsSummary"));

  const body = document.getElementById("prefsSummaryBody");
  body.innerHTML = monthsKeys.map((m,i)=>{
    const v = Number(currentPrefs[`شهر ${i+1}`] || 0);
    return v > 0 ? `<div>شهر ${i+1}: ${v} سهم</div>` : "";
  }).join("");
}

async function saveShares(){
  const v = Number(document.getElementById("sharesInput").value || 0);
  if(v <= 0){
    showMsg("err","عدد الأسهم غير صحيح");
    return;
  }

  await get("تعديل اشتراك جمعية", {
    token: userToken,
    معرف_الجمعية: currentSocietyId,
    عدد_الاسهم: v
  });

  // الرغبات انحذفت من السيرفر
  currentPrefs = null;
  currentShares = v;

  showStepPrefs();
}

function buildPrefsForm(){
  const box = document.getElementById("prefsForm");
  box.innerHTML = monthsKeys.map((m,i)=>`
    <div class="field">
      <label>شهر ${i+1}</label>
      <input type="number" min="0" step="0.5" class="input" id="pref_${i}">
    </div>
  `).join("");
}

async function savePrefs(){
  const payload = {};
  monthsKeys.forEach((_,i)=>{
    payload[`شهر${i+1}`] = document.getElementById(`pref_${i}`).value || "0";
    payload[`نوع${i+1}`] = "قابل للتعديل";
  });

  await get("حفظ الرغبات", {
    token: userToken,
    معرف_الجمعية: currentSocietyId,
    ...payload
  });

  const data = await get("رغبات حالة", {
    token: userToken,
    معرف_الجمعية: currentSocietyId
  });

  currentPrefs = data.رغبات;
  showSummary();
}

function editShares(){
  showStepShares();
}

function editPrefs(){
  showStepPrefs();
}

function backToSocieties(){
  hide(document.getElementById("societyPage"));
  show(document.getElementById("societiesList"));
}

(function(){
  bootstrap();
})();
