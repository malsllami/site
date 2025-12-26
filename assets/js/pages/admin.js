function showPanel(show){
  document.getElementById("loginBox").style.display = show ? "none" : "";
  document.getElementById("adminPanel").style.display = show ? "" : "none";
}

function showTab(name){
  document.getElementById("tabSoc").style.display = (name==="soc") ? "" : "none";
  document.getElementById("tabMem").style.display = (name==="mem") ? "" : "none";
  document.getElementById("tabNew").style.display = (name==="new") ? "" : "none";
}

function setNavBySession(){
  const s = جلسة();

  const navRegister = document.getElementById("navRegister");
  const navMember = document.getElementById("navMember");
  const navAdmin = document.getElementById("navAdmin");
  const logout = document.getElementById("logout");

  if(s && s.token){
    logout.style.display = "";
    navRegister.style.display = "none";

    if(s.role === "مدير"){
      navAdmin.style.display = "";
      navMember.style.display = "";
    }else{
      navAdmin.style.display = "none";
      navMember.style.display = "";
    }
  }else{
    logout.style.display = "none";
    navRegister.style.display = "";
    navAdmin.style.display = "none";
    navMember.style.display = "none";
  }
}

function bindLogout(){
  const logout = document.getElementById("logout");
  if(logout){
    logout.onclick = (e)=>{
      e.preventDefault();
      خروج();
    };
  }
}

function formatSocCard(s){
  const لون = (s.حالة === "نشطة") ? "#e8fff0" : (s.حالة === "جديدة") ? "#fff0f6" : "#f3f3f3";
  const border = (s.حالة === "نشطة") ? "#bfead0" : (s.حالة === "جديدة") ? "#ffd1e5" : "#e0e0e0";

  return `
    <div style="flex:1;min-width:240px;background:${لون};border:1px solid ${border};border-radius:16px;padding:14px">
      <div style="font-weight:900">${esc(s.اسم)}</div>
      <div class="small">
        تاريخ البداية ${esc(s.تاريخ_البداية)}<br>
        تاريخ النهاية ${esc(s.تاريخ_النهاية)}<br>
        الحالة ${esc(s.حالة)}<br>
        عدد المشتركين ${esc(s.عدد_المشتركين)}<br>
        عدد الاسهم ${esc(s.عدد_الاسهم)}<br>
        قيمة الجمعية الاجمالي ${esc(s.اجمالي_القيمة)}
      </div>
      <div class="mt12 align-end">
        <a class="btn" href="society.html?معرف=${encodeURIComponent(s.معرف)}">فتح</a>
      </div>
    </div>
  `;
}

function formatSocDetails(s){
  return `
    <div class="warn warn-gray">
      <b>${esc(s.اسم)}</b><br>
      معرف الجمعية ${esc(s.معرف)}<br>
      تاريخ البداية ${esc(s.تاريخ_البداية)}<br>
      تاريخ النهاية ${esc(s.تاريخ_النهاية)}<br>
      الحالة ${esc(s.حالة)}<br>
      عدد المشتركين ${esc(s.عدد_المشتركين)}<br>
      عدد الاسهم ${esc(s.عدد_الاسهم)}<br>
      قيمة الجمعية الاجمالي ${esc(s.اجمالي_القيمة)}
      <div class="mt12 align-end">
        <a class="btn" href="society.html?معرف=${encodeURIComponent(s.معرف)}">فتح صفحة الجمعية</a>
      </div>
      <div class="note">تفاصيل الاعضاء وسجل التعديلات سنفعله في المرحلة الثانية بعد تزويدي بسكربت قوقل والجداول.</div>
    </div>
  `;
}

async function loadSocieties(){
  const data = await get("قائمة الجمعيات", {});
  const arr = data.جمعيات || [];

  const cards = arr
    .filter(x=> (x.حالة==="جديدة" || x.حالة==="نشطة"))
    .slice(-3)
    .reverse();

  if(!cards.length){
    setHtml("socCards", `<div class="warn warn-gray">لا توجد جمعيات</div>`);
  }else{
    setHtml("socCards", `<div style="display:flex;gap:12px;flex-wrap:wrap">${cards.map(formatSocCard).join("")}</div>`);
  }

  const sel = document.getElementById("socSelect");
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "اختر جمعية";
  sel.appendChild(opt0);

  arr.forEach(s=>{
    const o = document.createElement("option");
    o.value = s.معرف;
    o.textContent = s.اسم + " , " + s.حالة + " , " + s.تاريخ_البداية;
    sel.appendChild(o);
  });

  sel.onchange = ()=>{
    const id = sel.value;
    const one = arr.find(x=> String(x.معرف)===String(id));
    setHtml("socDetails", one ? formatSocDetails(one) : "");
  };

  setHtml("socDetails", "");
}

async function loadMembers(){
  const s = جلسة();
  const data = await get("معلومات مدير", { token:s.token });
  const arr = data.مشتركين || [];

  if(!arr.length){
    setHtml("members", `<div class="warn warn-gray">لا يوجد مشتركين</div>`);
    return;
  }

  setHtml("members", `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>رقم الجوال</th>
            <th>رمز</th>
            <th>نسخ</th>
          </tr>
        </thead>
        <tbody>
          ${arr.map(m=>`
            <tr>
              <td data-label="الاسم">${esc(m.الاسم)}</td>
              <td data-label="رقم الجوال">${esc(m.رقم_الجوال)}</td>
              <td data-label="رمز"><b>${esc(m.رمز)}</b></td>
              <td data-label="نسخ">
                <button class="btn" onclick="navigator.clipboard.writeText('${String(m.رمز||"").replace(/'/g,"\\'")}')">نسخ</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `);
}

async function adminLogin(){
  msg("", "");
  try{
    const رمز = document.getElementById("adminPin").value.trim();
    if(!رمز) throw new Error("رمز PIN مطلوب");

    const data = await post({ action:"دخول بالرمز", رمز });
    if(data.دور !== "مدير") throw new Error("هذا الرمز ليس للمدير");

    حفظ_جلسة(data.token, "مدير");
    setNavBySession();
    showPanel(true);

    showTab("soc");
    await loadSocieties();
    await loadMembers();

    msg("ok", "تم تسجيل دخول المدير");
  }catch(e){
    msg("err", e.message || String(e));
  }
}

async function createSoc(){
  msg("", "");
  try{
    const s = جلسة();
    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value; // من type="date" جاهز yyyy-mm-dd

    if(!اسم_الجمعية) throw new Error("اسم الجمعية مطلوب");
    if(!تاريخ_البداية) throw new Error("تاريخ البداية مطلوب");

    await post({ action:"انشاء جمعية", token:s.token, اسم_الجمعية, تاريخ_البداية });
    msg("ok", "تم انشاء الجمعية");

    document.getElementById("socName").value = "";
    document.getElementById("socStart").value = "";

    showTab("soc");
    await loadSocieties();

  }catch(e){
    msg("err", e.message || String(e));
  }
}

(function init(){
  setNavBySession();
  bindLogout();

  document.getElementById("btnAdminLogin").onclick = adminLogin;

  document.getElementById("tabSocBtn").onclick = async ()=>{ showTab("soc"); await loadSocieties(); };
  document.getElementById("tabMemBtn").onclick = async ()=>{ showTab("mem"); await loadMembers(); };
  document.getElementById("tabNewBtn").onclick = ()=>{ showTab("new"); };

  document.getElementById("btnCreateSoc").onclick = createSoc;

  const s = جلسة();
  if(s && s.token && s.role==="مدير"){
    showPanel(true);
    showTab("soc");
    loadSocieties();
    loadMembers();
  }else{
    showPanel(false);
  }
})();
