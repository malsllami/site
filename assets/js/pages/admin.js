(function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }
})();

async function loadAdmin(){
  try{
    auth_ui();

    const s = جلسة();
    const data = await get("معلومات مدير", { token: s.token });

    const societies = data.جمعيات || [];
    const members = data.مشتركين || [];

    if(!societies.length){
      setHtml("adminSocieties", "<div class='warn warn-gray'>لا توجد جمعيات</div>");
    }else{
      setHtml("adminSocieties", societies.map(x => `
        <div class="soc" onclick="location.href='society.html?معرف=${encodeURIComponent(x.معرف)}'">
          <b>${esc(x.اسم)}</b>
          <div class="mt8">الحالة ${badge(x.حالة)}</div>
          <div class="mt8">عدد المشتركين ${esc(x.عدد_المشتركين || 0)}</div>
          <div class="mt8">عدد الاسهم ${esc(x.عدد_الاسهم || 0)}</div>
        </div>
      `).join(""));
    }

    if(!members.length){
      setHtml("adminMembers", "<div class='warn warn-gray'>لا يوجد مشتركين</div>");
    }else{
      setHtml("adminMembers", members.map(u => `
        <div class="soc">
          <b>${esc(u.الاسم)}</b>
          <div class="mt8">رقم الجوال ${esc(u.رقم_الجوال || "")}</div>
          <div class="mt8">PIN ${esc(u.رمز || "")}</div>
          <div class="mt8">${badge(u.حالة || "")}</div>
        </div>
      `).join(""));
    }

  }catch(e){
    msg("err", e.message || "خطأ غير معروف");
  }
}

async function createSociety(){
  const s = جلسة();
  try{
    msg("", "");

    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value.trim();

    disable("btnCreate", true);

    await get("انشاء جمعية", {
      token: s.token,
      اسم_الجمعية,
      تاريخ_البداية
    });

    msg("ok", "تم انشاء الجمعية");
    await loadAdmin();

  }catch(e){
    msg("err", e.message || "خطأ غير معروف");
  }finally{
    disable("btnCreate", false);
  }
}

function disable(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

loadAdmin();
