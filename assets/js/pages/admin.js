(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }
  await loadAdmin();
})();

function disable(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

async function loadAdmin(){
  const s = جلسة();
  msg("", "");
  try{
    const data = await get("معلومات مدير", { token: s.token });
    const list = data.جمعيات || [];

    if(!list.length){
      setHtml("socList", "<div class='warn warn-gray'>لا توجد جمعيات</div>");
      return;
    }

    setHtml("socList", list.map(x =>
      `<div class="soc">
         <b>${esc(x.اسم)}</b>
         <div class="mt8">${badge(x.حالة)}</div>
         <div class="mt8">البداية ${esc(x.تاريخ_البداية)}, النهاية ${esc(x.تاريخ_النهاية)}</div>
         <div class="mt8">المشتركين ${esc(x.عدد_المشتركين)}, الاسهم ${esc(x.عدد_الاسهم)}</div>
         <div class="align-end mt12">
           <button class="btn btn2" onclick="location.href='admin_member.html?معرف=${x.معرف}'">ادارة</button>
         </div>
       </div>`
    ).join(""));
  }catch(e){
    msg("err", e.message);
  }
}

async function createSociety(){
  const s = جلسة();
  msg("", "");
  disable("btnCreate", true);

  try{
    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value.trim();
    await post({ action: "انشاء جمعية", token: s.token, اسم_الجمعية, تاريخ_البداية });
    msg("ok", "تم انشاء الجمعية");
    document.getElementById("socName").value = "";
    await loadAdmin();
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnCreate", false);
  }
}
