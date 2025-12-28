window._sid = "";

(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  const sid = q("معرف") || q("sid") || "";
  if(!sid){
    msg("err", "معرف الجمعية غير موجود بالرابط");
    return;
  }
  window._sid = sid;

  try{
    const d = await get("تفاصيل جمعية للمشترك", { token: s.token, معرف_الجمعية: sid });
    const soc = d.جمعية;

    setHtml("socInfo",
      `<div class="kv"><div class="k">اسم الجمعية</div><div class="v">${esc(soc.اسم)}</div></div>
       <div class="kv"><div class="k">تاريخ البداية</div><div class="v">${esc(soc.تاريخ_البداية)}</div></div>
       <div class="kv"><div class="k">تاريخ النهاية</div><div class="v">${esc(soc.تاريخ_النهاية)}</div></div>
       <div class="kv"><div class="k">الحالة</div><div class="v">${badge(soc.حالة)}</div></div>
       <div class="kv"><div class="k">عدد المشتركين</div><div class="v">${esc(soc.عدد_المشتركين)}</div></div>
       <div class="kv"><div class="k">عدد الاسهم</div><div class="v">${esc(soc.عدد_الاسهم)}</div></div>
       <div class="kv"><div class="k">قيمة الاجمالي</div><div class="v">${esc(soc.اجمالي_القيمة)}</div></div>`
    );

    const joined = !!d.مشترك_مسجل;
    const shares = Number(d.عدد_اسهم_المشترك || 0);

    document.getElementById("subControls").style.display = "";
    document.getElementById("shares").value = shares ? String(shares) : "1";

    if(joined){
      setHtml("subState", `<div class="ok">انت مشترك مسبقا في هذه الجمعية</div>`);
      document.getElementById("btnJoin").style.display = "none";
      document.getElementById("btnUpdate").style.display = "";
      document.getElementById("btnLeave").style.display = "";
      document.getElementById("prefArea").style.display = (String(soc.حالة) === "جديدة") ? "" : "none";
    }else{
      setHtml("subState", `<div class="warn warn-gray">انت غير مشترك في هذه الجمعية</div>`);
      document.getElementById("btnJoin").style.display = "";
      document.getElementById("btnUpdate").style.display = "none";
      document.getElementById("btnLeave").style.display = "none";
      document.getElementById("prefArea").style.display = "none";
    }

  }catch(e){
    msg("err", e.message);
  }
})();

function disable(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

async function joinSociety(){
  const s = جلسة();
  msg("", "");
  disable("btnJoin", true);

  try{
    const عدد_الاسهم = document.getElementById("shares").value.trim();
    await post({ action: "اشتراك جمعية", token: s.token, معرف_الجمعية: window._sid, عدد_الاسهم });
    msg("ok", "تم التسجيل");
    location.href = "preferences.html?معرف=" + encodeURIComponent(window._sid);
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnJoin", false);
  }
}

async function updateShares(){
  const s = جلسة();
  msg("", "");
  disable("btnUpdate", true);

  try{
    const عدد_الاسهم = document.getElementById("shares").value.trim();
    await post({ action: "تعديل اشتراك جمعية", token: s.token, معرف_الجمعية: window._sid, عدد_الاسهم });
    msg("ok", "تم تعديل الاسهم, اذا كانت لك رغبات سابقة تم حذفها وتحتاج تعيد ادخالها");
    document.getElementById("prefArea").style.display = "";
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnUpdate", false);
  }
}

async function leaveSociety(){
  const s = جلسة();
  msg("", "");
  disable("btnLeave", true);

  try{
    await post({ action: "انسحاب جمعية", token: s.token, معرف_الجمعية: window._sid });
    msg("ok", "تم الانسحاب");
    location.href = "member.html";
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnLeave", false);
  }
}
