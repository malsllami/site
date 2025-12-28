(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }
  document.getElementById("navLogout").style.display = "";
  await loadAdmin();
})();

async function loadAdmin(){
  const s = جلسة();
  msg("", "");
  try{
    const d = await get("معلومات مدير", { token: s.token });
    const list = d.جمعيات || [];

    const news = list.filter(x => String(x.حالة) === "جديدة");
    const actives = list.filter(x => String(x.حالة) !== "جديدة");

    renderSocCards("newSocieties", news);
    renderSocCards("activeSocieties", actives);

  }catch(e){
    msg("err", e.message);
  }
}

function renderSocCards(el, arr){
  if(!arr.length){
    setHtml(el, "<div class='warn warn-gray'>لا يوجد</div>");
    return;
  }

  setHtml(el, arr.map(s => `
    <div class="cardItem">
      <div class="titleRow">
        <b>${esc(s.اسم)}</b>
        ${badge(s.حالة)}
      </div>
      <div class="meta">
        <div>البداية ${esc(s.تاريخ_البداية || "")}</div>
        <div>النهاية ${esc(s.تاريخ_النهاية || "")}</div>
        <div>عدد المشتركين ${esc(s.عدد_المشتركين || 0)}</div>
        <div>عدد الاسهم ${esc(s.عدد_الاسهم || 0)}</div>
      </div>
      <div class="actions">
        <button class="btn btn2" onclick="openSoc('${esc(s.معرف)}')">ادخل</button>
      </div>
    </div>
  `).join(""));
}

function openSoc(id){
  location.href = "admin_member.html?معرف=" + encodeURIComponent(id);
}

let _busyCreate = false;
async function createSociety(){
  if(_busyCreate) return;
  _busyCreate = true;

  const s = جلسة();
  msg("", "");

  const اسم_الجمعية = document.getElementById("socName").value.trim();
  const تاريخ_البداية = document.getElementById("socStart").value.trim();

  try{
    await post({
      action: "انشاء جمعية",
      token: s.token,
      اسم_الجمعية,
      تاريخ_البداية
    });
    document.getElementById("socName").value = "";
    msg("ok", "تم انشاء الجمعية");
    await loadAdmin();
  }catch(e){
    msg("err", e.message);
  }finally{
    _busyCreate = false;
  }
}
